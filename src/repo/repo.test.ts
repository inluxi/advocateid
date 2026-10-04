import { beforeAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { useTestDb } from "@/test/db";
import { accounts, otpLogs, pageDailyEvents, pages, searchIndex, sessions, courts, localities, categories, slugHistory } from "@/db/schema";
import { seedDemo, seedReference } from "@/db/seed-run";
import { findOrCreateAccount, createOtp, verifyOtp, createSession, loadSession, purgeOtpLogs, OTP_MAX_ATTEMPTS } from "./auth";
import {
  addListItem, changeSlug, createPage, deletePage, getPageBySlug, loadBundle, moveListItem, removeListItem, resolveSlug, setPlan,
  slugState, updatePage, DomainError, recallSlug,
} from "./pages";
import { runSearch, similarAndNearby } from "./search";
import { importCourtsCsv, listDistricts } from "./reference";
import { decide, inviteLawyer, listLawyers, requestToJoin } from "./memberships";
import { createPost, listCourtUpdates } from "./posts";
import { recordEvent, rollupDay, purgeRawEvents } from "./analytics";
import { hit } from "@/lib/rate-limit";
import { exportAccountData, requestAccountDeletion, cancelDeletionIfPending, purgeDeletedAccounts } from "./privacy";
import { addDomain } from "./domains";
import { checkWording } from "@/lib/wording";
import { DEMO_PAGES, DEMO_POSTS, DEMO_UPDATES, CATEGORIES } from "@/db/seed-data";

let districtEkm: number;
let courtId: number;

beforeAll(async () => {
  await useTestDb();
  await seedReference();
  const d = await getDb().select().from(localities).where(eq(localities.code, "ekm"));
  districtEkm = d[0].id;
  courtId = (await getDb().select().from(courts).limit(1))[0].id;
});

let mobileSeq = 0;
const newAccount = async () => (await findOrCreateAccount(`+9188${String(++mobileSeq).padStart(8, "0")}`)).id;
const newPage = (accountId: number, slug: string, type: "advocate" | "firm" = "advocate") =>
  createPage(accountId, { type, name: "Test Person", slug, districtId: districtEkm, enrolmentNo: type === "advocate" ? "K/1/2020" : undefined });

describe("reference data and court CSV import", () => {
  it("seeds districts, categories and courts", async () => {
    expect((await listDistricts()).length).toBeGreaterThan(10);
    const all = await getDb().select().from(courts);
    expect(all.length).toBe(15);
    expect(all.every((c) => /^[a-z0-9]{2,8}$/.test(c.code))).toBe(true);
  });
  it("is idempotent on re-import and reports validation errors", async () => {
    const again = await seedReference();
    expect(again.courts).toBe(15);
    const bad = await importCourtsCsv("id,name,kind,state,district_code,city\nX1,Court A,Court,Kerala,ekm,Kochi\nX1,Court B,Court,Kerala,ekm,Kochi");
    expect(bad.errors.some((e) => e.message.includes("duplicate id"))).toBe(true);
    const missing = await importCourtsCsv("id,name\nX1,Court A");
    expect(missing.errors[0].message).toContain("Missing required columns");
    const badNum = await importCourtsCsv("id,name,kind,state,district_code,city,latitude\nX9,Court Z,Court,Kerala,ekm,Kochi,abc");
    expect(badNum.errors.some((e) => e.message.includes("latitude"))).toBe(true);
  });
  it("auto-creates missing localities and updates by id", async () => {
    const csv = "id,name,kind,state,district_code,city,locality,latitude,longitude\nKL-TEST-1,Test Munsiff Court,Magistrate Court,Kerala,ekm,Kochi,Fort Kochi,9.96,76.24";
    const r1 = await importCourtsCsv(csv);
    expect(r1.errors).toEqual([]);
    expect(r1.inserted).toBe(1);
    expect(r1.localitiesCreated).toBeGreaterThanOrEqual(1);
    const r2 = await importCourtsCsv(csv.replace("Test Munsiff Court", "Test Munsiff Court Renamed"));
    expect(r2.updated).toBe(1);
    expect(r2.inserted).toBe(0);
  });
});

describe("OTP login", () => {
  it("stores only hashes and logs in with the right OTP", async () => {
    const mobile = "+919111111111";
    const otp = await createOtp(mobile);
    const rows = await getDb().select().from(otpLogs);
    const row = rows[rows.length - 1];
    expect(row.otpHash).not.toContain(otp);
    expect(JSON.stringify(row)).not.toContain(mobile.slice(3));
    expect(await verifyOtp(mobile, otp)).toBe("ok");
    expect(await verifyOtp(mobile, otp)).toBe("invalid"); // single use
  });
  it("rejects a wrong OTP and locks after 3 attempts", async () => {
    const mobile = "+919222222222";
    const otp = await createOtp(mobile);
    const wrong = otp === "123456" ? "654321" : "123456";
    for (let i = 0; i < OTP_MAX_ATTEMPTS - 1; i++) expect(await verifyOtp(mobile, wrong)).toBe("invalid");
    expect(await verifyOtp(mobile, wrong)).toBe("locked");
    expect(await verifyOtp(mobile, otp)).toBe("locked");
  });
  it("expires OTPs after 10 minutes", async () => {
    const mobile = "+919333333333";
    const otp = await createOtp(mobile);
    await getDb().update(otpLogs).set({ expiresAt: new Date(Date.now() - 1000) });
    expect(await verifyOtp(mobile, otp)).toBe("expired");
  });
  it("a new OTP invalidates the old one", async () => {
    const mobile = "+919444444444";
    const first = await createOtp(mobile);
    const second = await createOtp(mobile);
    if (first !== second) expect(await verifyOtp(mobile, first)).toBe("invalid");
    expect(await verifyOtp(mobile, second)).toBe("ok");
  });
  it("one mobile is one account; sessions are hashed", async () => {
    const a = await findOrCreateAccount("+919555555555");
    const b = await findOrCreateAccount("+919555555555");
    expect(a.id).toBe(b.id);
    expect(b.isNew).toBe(false);
    const { token } = await createSession(a.id);
    const rows = await getDb().select().from(sessions).where(eq(sessions.accountId, a.id));
    expect(rows[0].tokenHash).not.toBe(token);
    expect((await loadSession(token))?.accountId).toBe(a.id);
    expect(await loadSession("nope")).toBeNull();
  });
  it("purges OTP logs after 7 days", async () => {
    await getDb().update(otpLogs).set({ createdAt: new Date(Date.now() - 8 * 86400_000) });
    expect(await purgeOtpLogs()).toBeGreaterThan(0);
    expect((await getDb().select().from(otpLogs)).length).toBe(0);
  });
  it("rate limits requests per key", async () => {
    const results = [];
    for (let i = 0; i < 4; i++) results.push((await hit("otp_send_test", "1.2.3.4", 3, 900)).ok);
    expect(results).toEqual([true, true, true, false]);
    expect((await hit("otp_send_test", "5.6.7.8", 3, 900)).ok).toBe(true);
  });
});

describe("pages: creation rules", () => {
  it("creates an advocate page with the minimum fields and defaults to the login number", async () => {
    const acc = await newAccount();
    const p = await newPage(acc, "min-fields-adv");
    expect(p.status).toBe("active");
    expect(p.plan).toBe("basic");
    expect(p.contactMobile).toMatch(/^\+91/);
    const b = await loadBundle(p);
    expect(b.enrolmentNo).toBe("K/1/2020");
  });
  it("requires an enrolment number for advocate pages", async () => {
    const acc = await newAccount();
    await expect(createPage(acc, { type: "advocate", name: "No Enrol", slug: "no-enrolment", districtId: districtEkm })).rejects.toMatchObject({ code: "enrolment_required" });
  });
  it("limits an account to 3 pages", async () => {
    const acc = await newAccount();
    await newPage(acc, "limit-page-one");
    await newPage(acc, "limit-page-two", "firm");
    await newPage(acc, "limit-page-three");
    await expect(newPage(acc, "limit-page-four")).rejects.toMatchObject({ code: "page_limit" });
  });
  it("rejects reserved, short, duplicate and badly formed slugs", async () => {
    const acc = await newAccount();
    await expect(newPage(acc, "admin")).rejects.toMatchObject({ code: "slug_reserved" });
    await expect(newPage(acc, "abcd")).rejects.toMatchObject({ code: "slug_length" });
    await expect(newPage(acc, "lawyers")).rejects.toMatchObject({ code: "slug_reserved" });
    await expect(newPage(acc, "Bad_Slug!")).rejects.toMatchObject({ code: "slug_chars" });
    await newPage(acc, "unique-slug-1");
    const acc2 = await newAccount();
    await expect(newPage(acc2, "unique-slug-1")).rejects.toMatchObject({ code: "slug_taken" });
  });
  it("rejects a non-district location", async () => {
    const acc = await newAccount();
    const kerala = (await getDb().select().from(localities).where(eq(localities.code, "kl")))[0];
    await expect(createPage(acc, { type: "firm", name: "Firm X", slug: "firm-bad-district", districtId: kerala.id })).rejects.toMatchObject({ code: "district_invalid" });
  });
});

describe("pages: slug change, redirect, reservation", () => {
  it("changes once per 90 days, redirects the old slug and reserves it", async () => {
    const acc = await newAccount();
    const p = await newPage(acc, "old-slug-aaa");
    const changed = await changeSlug(p, "new-slug-aaa");
    expect(changed.slug).toBe("new-slug-aaa");
    expect(await resolveSlug("old-slug-aaa")).toEqual({ kind: "redirect", slug: "new-slug-aaa" });
    expect((await resolveSlug("new-slug-aaa")).kind).toBe("page");
    expect(await slugState("old-slug-aaa")).toBe("reserved");
    await expect(changeSlug(changed, "third-slug-aaa")).rejects.toMatchObject({ code: "slug_cooldown" });
    // after 90 days it is allowed again
    const later = new Date(Date.now() + 91 * 86400_000);
    const again = await changeSlug(changed, "third-slug-aaa", later);
    expect(again.slug).toBe("third-slug-aaa");
    // another account cannot take a reserved slug
    const other = await newAccount();
    await expect(newPage(other, "old-slug-aaa")).rejects.toMatchObject({ code: "slug_taken" });
  });
  it("reserves a deleted slug for 90 days (410) and frees the page slot after 30 days", async () => {
    const acc = await newAccount();
    const p = await newPage(acc, "to-delete-aaa");
    await deletePage(p, "owner");
    expect(await getPageBySlug("to-delete-aaa")).toBeNull();
    expect((await resolveSlug("to-delete-aaa")).kind).toBe("gone");
    const other = await newAccount();
    await expect(newPage(other, "to-delete-aaa")).rejects.toMatchObject({ code: "slug_taken" });
    // search index is cleared
    expect((await getDb().select().from(searchIndex).where(eq(searchIndex.pageId, p.id))).length).toBe(0);
    // expire the reservation: slug can be used again
    await getDb().update(slugHistory).set({ validTo: new Date(Date.now() - 1000) }).where(eq(slugHistory.oldSlug, "to-delete-aaa"));
    const reuse = await newPage(other, "to-delete-aaa");
    expect(reuse.slug).toBe("to-delete-aaa");
  });
  it("admin recall gives the page a neutral address and reserves the old one", async () => {
    const acc = await newAccount();
    const p = await newPage(acc, "recall-me-aaa");
    const r = await recallSlug(p.id, 1, "trademark complaint");
    expect(r.slug).toBe(`page-${p.id}`);
    expect((await resolveSlug("recall-me-aaa")).kind).toBe("gone");
  });
});

describe("pages: lists and plan limits (entitlement module)", () => {
  it("enforces Basic limits and gates highlights, links and banner", async () => {
    const acc = await newAccount();
    const p = await newPage(acc, "basic-limits-aa");
    await addListItem(p, "cases", { courtId, role: "Appeared for the petitioner", year: 2022, outcome: "settled" });
    await addListItem(p, "cases", { courtId, role: "Appeared for the respondent", year: 2021, outcome: "pending" });
    await expect(addListItem(p, "cases", { courtId, role: "Appeared for the petitioner", year: 2020, outcome: "other" })).rejects.toMatchObject({ code: "limit_reached", status: 402 });
    await expect(addListItem(p, "highlights", { number: 5, label: "Offices" })).rejects.toMatchObject({ code: "plan_required" });
    await expect(addListItem(p, "links", { url: "https://www.linkedin.com/in/x" })).rejects.toMatchObject({ code: "plan_required" });
    await expect(updatePage(p, { bannerKey: "banners/x" })).rejects.toMatchObject({ code: "plan_required" });
  });
  it("hides items beyond the limit after a downgrade but never deletes them", async () => {
    const acc = await newAccount();
    const p = await newPage(acc, "downgrade-aaa1");
    await getDb().update(pages).set({ plan: "professional" }).where(eq(pages.id, p.id));
    const pro = (await getPageBySlug("downgrade-aaa1"))!;
    for (let i = 0; i < 4; i++) await addListItem(pro, "cases", { courtId, role: "Appeared for the petitioner", year: 2010 + i, outcome: "settled" });
    await setPlan(p.id, "basic", 1);
    const basic = (await getPageBySlug("downgrade-aaa1"))!;
    const pub = await loadBundle(basic);
    expect(pub.cases.length).toBe(2);
    expect(pub.hidden.caseSummaries).toBe(2);
    const owner = await loadBundle(basic, { forOwner: true });
    expect(owner.cases.length).toBe(4);
    await setPlan(p.id, "professional", 1);
    expect((await loadBundle((await getPageBySlug("downgrade-aaa1"))!)).cases.length).toBe(4);
  });
  it("adds, reorders with arrows and removes list items (soft delete)", async () => {
    const acc = await newAccount();
    const p = await newPage(acc, "reorder-aaa11");
    const cats = await getDb().select().from(categories).limit(3);
    const ids: number[] = [];
    for (const c of cats) ids.push((await addListItem(p, "categories", { categoryId: c.id })).id);
    await moveListItem(p, "categories", ids[2], "up");
    const b = await loadBundle(p, { forOwner: true });
    expect(b.categories.map((c) => c.itemId)).toEqual([ids[0], ids[2], ids[1]]);
    await removeListItem(p, "categories", ids[0], "owner");
    expect((await loadBundle(p, { forOwner: true })).categories.length).toBe(2);
    await expect(addListItem(p, "categories", { categoryId: cats[1].id })).rejects.toMatchObject({ code: "duplicate" });
  });
  it("rejects bad list input", async () => {
    const acc = await newAccount();
    const p = await newPage(acc, "bad-input-aaa1");
    await getDb().update(pages).set({ plan: "professional" }).where(eq(pages.id, p.id));
    const pro = (await getPageBySlug("bad-input-aaa1"))!;
    await expect(addListItem(pro, "highlights", { number: 1000, label: "Offices" })).rejects.toThrow();
    await expect(addListItem(pro, "highlights", { number: 5, label: "x".repeat(21) })).rejects.toThrow();
    await expect(addListItem(pro, "links", { url: "https://example.com/book-now" })).rejects.toMatchObject({ code: "link_booking" });
    await expect(addListItem(pro, "links", { url: "javascript:alert(1)" })).rejects.toThrow();
    await expect(addListItem(pro, "career", { yearFrom: 2020, yearTo: 2010, title: "Advocate" })).rejects.toMatchObject({ code: "years_order" });
    await expect(addListItem(pro, "courts", { courtId: 999999 })).rejects.toMatchObject({ code: "court_invalid" });
    const link = await addListItem(pro, "links", { url: "https://www.linkedin.com/in/someone" });
    const b = await loadBundle(pro);
    expect(b.links.find((l) => l.id === link.id)?.iconKey).toBe("linkedin");
  });
  it("offices: first is main, courts attach, phone needs OTP, removing main promotes the next", async () => {
    const acc = await newAccount();
    const p = await newPage(acc, "offices-aaa111", "firm");
    await getDb().update(pages).set({ plan: "professional" }).where(eq(pages.id, p.id));
    const pro = (await getPageBySlug("offices-aaa111"))!;
    const o1 = await addListItem(pro, "offices", { name: "Main office", address: "Road 1", about: "Main office near the court.", courtIds: [courtId] });
    const o2 = await addListItem(pro, "offices", { name: "Branch office", phone: "9876543210" });
    const b = await loadBundle(pro, { forOwner: true });
    expect(b.offices.find((o) => o.id === o1.id)?.isMain).toBe(true);
    expect(b.offices.find((o) => o.id === o1.id)?.courts.length).toBe(1);
    expect(b.offices.find((o) => o.id === o2.id)?.phoneVerified).toBe(false);
    await removeListItem(pro, "offices", o1.id, "owner");
    const after = await loadBundle(pro, { forOwner: true });
    expect(after.offices.find((o) => o.id === o2.id)?.isMain).toBe(true);
  });
});

describe("pages: updates", () => {
  it("rejects a contact number that is not the login number without OTP", async () => {
    const acc = await newAccount();
    const p = await newPage(acc, "contact-aaaa11");
    await expect(updatePage(p, { contactMobile: "9876500000" })).rejects.toMatchObject({ code: "mobile_unverified" });
    await expect(updatePage(p, { contactMobile: "123" })).rejects.toMatchObject({ code: "mobile_invalid" });
  });
  it("enforces brand colour contrast and the Premium gate", async () => {
    const acc = await newAccount();
    const p = await newPage(acc, "brand-aaaa111");
    await expect(updatePage(p, { brandColour: "#16233F" })).rejects.toMatchObject({ code: "plan_required" });
    await setPlan(p.id, "premium", 1);
    const prem = (await getPageBySlug("brand-aaaa111"))!;
    await expect(updatePage(prem, { brandColour: "#FFEE99" })).rejects.toMatchObject({ code: "contrast" });
    await updatePage(prem, { brandColour: "#16233F" });
    expect((await loadBundle(prem)).custom?.brandColour).toBe("#16233F");
  });
});

describe("seed demo content, search and ranking", () => {
  beforeAll(async () => {
    await seedDemo();
  });
  it("seed content passes the Bar Council wording check", () => {
    const texts: string[] = [];
    for (const p of DEMO_PAGES) texts.push(p.name, p.bio, p.about ?? "", ...(p.offices ?? []).map((o) => o.about), ...(p.career ?? []).map((c) => c.title), ...(p.cases ?? []).map((c) => `${c.role} ${c.note ?? ""}`));
    for (const p of DEMO_POSTS) texts.push(p.title, p.body);
    for (const u of DEMO_UPDATES) texts.push(u.title, u.body);
    for (const c of CATEGORIES) texts.push(c.name);
    for (const t of texts) expect(checkWording(t), t).toMatchObject({ flagged: false });
  });
  it("searches by district and returns advocates and firms, never offices by default", async () => {
    const r = await runSearch({ d: "ekm" });
    expect(r.total).toBeGreaterThanOrEqual(5);
    expect(r.cards.every((c) => c.kind !== "office")).toBe(true);
  });
  it("filters by practice area, court and text", async () => {
    const fam = await runSearch({ d: "ekm", p: "fam" });
    expect(fam.cards.map((c) => c.slug)).toContain("asha-menon");
    expect(fam.cards.map((c) => c.slug)).not.toContain("rahul-nair-adv");
    const court = await runSearch({ c: (await getDb().select().from(courts).where(eq(courts.importKey, "KL-FC-EKM")))[0].code });
    expect(court.cards.map((c) => c.slug)).toContain("asha-menon");
    const q = await runSearch({ d: "ekm", q: "menon" });
    expect(q.cards.length).toBeGreaterThan(0);
    const none = await runSearch({ d: "ekm", p: "tax" });
    expect(none.total).toBe(0);
  });
  it("puts the source page first for the practice-area click", async () => {
    const asha = (await getPageBySlug("asha-menon"))!;
    const r = await runSearch({ d: "ekm", firstPageId: asha.id });
    expect(r.cards[0].slug).toBe("asha-menon");
    expect(r.cards[0].isSource).toBe(true);
  });
  it("lists office rows only when asked and only for offices with a description", async () => {
    const r = await runSearch({ d: "ekm", t: "office" });
    expect(r.cards.length).toBeGreaterThan(0);
    expect(r.cards.every((c) => c.kind === "office")).toBe(true);
  });
  it("paginates with a keyset cursor without repeating items", async () => {
    const first = await runSearch({ d: "ekm" }, { pageSize: 3 });
    expect(first.nextCursor).not.toBeNull();
    const second = await runSearch({ d: "ekm" }, { pageSize: 3, cursor: first.nextCursor });
    const ids1 = first.cards.map((c) => c.key);
    expect(second.cards.every((c) => !ids1.includes(c.key))).toBe(true);
  });
  it("shows nearby and similar advocates for a Basic page only through the helper", async () => {
    const sneha = (await getPageBySlug("sneha-pillai"))!;
    const { nearby, similar } = await similarAndNearby(sneha, "en");
    expect(nearby.every((c) => c.pageId !== sneha.id)).toBe(true);
    expect(similar.every((c) => c.pageId !== sneha.id)).toBe(true);
  });
  it("hides Basic-hidden items from search after downgrade", async () => {
    const rahul = (await getPageBySlug("rahul-nair-adv"))!;
    expect(rahul.plan).toBe("premium");
  });
  it("plan never changes ranking quality inputs", async () => {
    const a = (await getPageBySlug("asha-menon"))!;
    const before = (await getPageBySlug("asha-menon"))!.score;
    await setPlan(a.id, "premium", 1);
    const after = (await getPageBySlug("asha-menon"))!.score;
    await setPlan(a.id, "professional", 1);
    expect(after).toBeCloseTo(before, 6);
  });
  it("court updates are listed per court, with and without a page author", async () => {
    const hc = (await getDb().select().from(courts).where(eq(courts.importKey, "KL-HC-001")))[0];
    const updates = await listCourtUpdates(hc.id);
    expect(updates.length).toBe(1);
    expect(updates[0].pageId).toBeNull();
    const fc = (await getDb().select().from(courts).where(eq(courts.importKey, "KL-FC-EKM")))[0];
    expect((await listCourtUpdates(fc.id))[0].pageId).not.toBeNull();
  });
});

describe("memberships", () => {
  it("Basic firms invite; Professional+ firms accept requests; decisions are by the right side", async () => {
    const owner = await newAccount();
    const basicFirm = await newPage(owner, "basic-firm-aaaa", "firm");
    const advOwner = await newAccount();
    const adv = await newPage(advOwner, "member-adv-aaaa");
    await expect(requestToJoin(adv, basicFirm.id, "Associate", null)).rejects.toMatchObject({ code: "firm_not_accepting" });
    const inv = await inviteLawyer(basicFirm, adv.id, "Associate", null);
    await expect(decide(inv, "firm", true)).rejects.toMatchObject({ code: "forbidden" });
    await decide(inv, "advocate", true);
    expect((await listLawyers(basicFirm)).items.length).toBe(1);
    // Basic firm: only 1 lawyer slot
    const adv2 = await newPage(await newAccount(), "member-adv-bbbb");
    await expect(inviteLawyer(basicFirm, adv2.id, "Associate", null)).rejects.toMatchObject({ code: "lawyer_limit" });
    // Professional firm
    await setPlan(basicFirm.id, "professional", 1);
    const pro = (await getPageBySlug("basic-firm-aaaa"))!;
    const m = await requestToJoin(adv2, pro.id, "Partner", null);
    await expect(decide(m, "advocate", true)).rejects.toMatchObject({ code: "forbidden" });
    await decide(m, "firm", true);
    expect((await listLawyers(pro)).items.length).toBe(2);
  });
  it("an advocate can be in at most 5 firms", async () => {
    const adv = await newPage(await newAccount(), "five-firms-adv1");
    for (let i = 0; i < 5; i++) {
      const firmPage = await newPage(await newAccount(), `five-firm-${i}-aa`, "firm");
      await setPlan(firmPage.id, "professional", 1);
      await requestToJoin(adv, firmPage.id, "Associate", null);
    }
    const sixth = await newPage(await newAccount(), "five-firm-5-aa", "firm");
    await setPlan(sixth.id, "professional", 1);
    await expect(requestToJoin(adv, sixth.id, "Associate", null)).rejects.toMatchObject({ code: "firm_limit" });
  });
});

describe("posts and court updates", () => {
  it("requires court and source link for a court update and caps categories at 3", async () => {
    const p = await newPage(await newAccount(), "poster-aaaa111");
    const cats = await getDb().select().from(categories).limit(4);
    await expect(createPost(p.id, "court_update", { title: "T", body: "Body text here.", language: "en", categoryIds: [], courtId: courtId, sourceUrl: null })).rejects.toMatchObject({ code: "source_required" });
    await expect(createPost(p.id, "court_update", { title: "T", body: "Body text here.", language: "en", categoryIds: [], courtId: null, sourceUrl: "https://example.org/x" })).rejects.toMatchObject({ code: "court_required" });
    await expect(createPost(p.id, "article", { title: "Title", body: "Body text here.", language: "en", categoryIds: cats.map((c) => c.id), courtId: null, sourceUrl: null })).rejects.toMatchObject({ code: "too_many_categories" });
    const ok = await createPost(p.id, "article", { title: "Title", body: "Body text here.", language: "en", categoryIds: [cats[0].id], courtId: null, sourceUrl: null });
    expect(ok.status).toBe("published");
  });
  it("posting raises the author's quality score", async () => {
    const p = await newPage(await newAccount(), "score-aaaa1111");
    const before = (await getPageBySlug("score-aaaa1111"))!.score;
    await createPost(p.id, "article", { title: "A title", body: "Some body text for the article.", language: "en", categoryIds: [], courtId: null, sourceUrl: null });
    const after = (await getPageBySlug("score-aaaa1111"))!.score;
    expect(after).toBeGreaterThan(before);
  });
});

describe("analytics events", () => {
  it("records every load, rolls up cleaned counts per host and purges raw rows after 30 days", async () => {
    const p = await newPage(await newAccount(), "events-aaaa111");
    const day = new Date().toISOString().slice(0, 10);
    const base = { pageId: p.id, host: "advocateid.in", context: null, action: null };
    await recordEvent({ ...base, visitorId: "v1", eventType: "view", isOwner: false, isBot: false });
    await recordEvent({ ...base, visitorId: "v1", eventType: "view", isOwner: false, isBot: false }); // same visitor, same day
    await recordEvent({ ...base, visitorId: "v2", eventType: "view", isOwner: false, isBot: false });
    await recordEvent({ ...base, visitorId: "own", eventType: "view", isOwner: true, isBot: false });
    await recordEvent({ ...base, visitorId: "bot", eventType: "view", isOwner: false, isBot: true });
    await recordEvent({ ...base, visitorId: "v1", eventType: "connect", action: "whatsapp", isOwner: false, isBot: false });
    await recordEvent({ ...base, host: "example.com", visitorId: "v3", eventType: "view", isOwner: false, isBot: false });
    await rollupDay(day);
    const rows = await getDb().select().from(pageDailyEvents).where(eq(pageDailyEvents.pageId, p.id));
    const main = rows.find((r) => r.host === "advocateid.in")!;
    expect(main.rawViews).toBe(5);
    expect(main.views).toBe(2); // owner and bot removed, v1 counted once
    expect(main.connects).toBe(1);
    expect(rows.find((r) => r.host === "example.com")!.views).toBe(1);
    // idempotent
    await rollupDay(day);
    expect((await getDb().select().from(pageDailyEvents).where(eq(pageDailyEvents.pageId, p.id))).length).toBe(2);
    expect(await purgeRawEvents()).toBe(0);
  });
});

describe("DPDP: export, deletion grace period, hard delete", () => {
  it("exports only the account's own data", async () => {
    const acc = await newAccount();
    await newPage(acc, "export-aaaa111");
    const other = await newAccount();
    await newPage(other, "export-bbbb111");
    const data = await exportAccountData(acc);
    expect(data.pages.length).toBe(1);
    expect(JSON.stringify(data)).not.toContain("export-bbbb111");
  });
  it("hides pages on a deletion request, restores on login, and erases after 30 days", async () => {
    const acc = await newAccount();
    const p = await newPage(acc, "erase-aaaa1111");
    await requestAccountDeletion(acc);
    expect((await getDb().select().from(searchIndex).where(eq(searchIndex.pageId, p.id))).length).toBe(0);
    expect((await getPageBySlug("erase-aaaa1111"))?.status).toBe("suspended");
    expect(await cancelDeletionIfPending(acc)).toBe(true);
    expect((await getPageBySlug("erase-aaaa1111"))?.status).toBe("active");
    await requestAccountDeletion(acc);
    await getDb().update(accounts).set({ deletionRequestedAt: new Date(Date.now() - 31 * 86400_000) }).where(eq(accounts.id, acc));
    expect(await purgeDeletedAccounts()).toBe(1);
    expect((await getDb().select().from(accounts).where(eq(accounts.id, acc))).length).toBe(0);
    expect((await getDb().select().from(pages).where(eq(pages.accountId, acc))).length).toBe(0);
  });
});

describe("custom domains", () => {
  it("needs Premium, validates hostnames and refuses duplicates", async () => {
    const p = await newPage(await newAccount(), "domain-aaaa111");
    await expect(addDomain(p, "www.example.com")).rejects.toMatchObject({ code: "plan_required" });
    await setPlan(p.id, "premium", 1);
    const prem = (await getPageBySlug("domain-aaaa111"))!;
    await expect(addDomain(prem, "advocateid.in")).rejects.toMatchObject({ code: "hostname_invalid" });
    const d = await addDomain(prem, "https://www.example-law.in/");
    expect(d.hostname).toBe("www.example-law.in");
    expect(d.status).toBe("pending");
    const other = await newPage(await newAccount(), "domain-bbbb111");
    await setPlan(other.id, "premium", 1);
    await expect(addDomain((await getPageBySlug("domain-bbbb111"))!, "www.example-law.in")).rejects.toMatchObject({ code: "hostname_taken" });
  });
});

it("DomainError carries status and code", () => {
  const e = new DomainError("x", "msg", 418);
  expect(e.status).toBe(418);
});
