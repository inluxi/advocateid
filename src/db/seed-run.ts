import { eq } from "drizzle-orm";
import { getDb } from "./client";
import { categories, categoryTranslations, courtDetails, courts, courtTranslations, localities, pages } from "./schema";
import { AREAS, CATEGORIES, COURT_CSV, COURT_DETAILS, DEMO_PAGES, DEMO_POSTS, DEMO_UPDATES, DISTRICTS, STATES } from "./seed-data";
import { importCourtsCsv } from "@/repo/reference";
import { findOrCreateAccount, recordConsent } from "@/repo/auth";
import { addListItem, createPage, refreshPage, updatePage } from "@/repo/pages";
import { createPost } from "@/repo/posts";
import { decide, requestToJoin } from "@/repo/memberships";

/** Idempotent: safe to run on every deploy. */
export async function seedReference(): Promise<{ courts: number }> {
  const db = getDb();
  const stateIds = new Map<string, number>();
  for (const s of STATES) {
    const existing = await db.select().from(localities).where(eq(localities.code, s.code)).limit(1);
    if (existing[0]) stateIds.set(s.code, existing[0].id);
    else {
      const [r] = await db.insert(localities).values({ code: s.code, name: s.name, localName: s.local, level: "state" }).returning({ id: localities.id });
      stateIds.set(s.code, r.id);
    }
  }
  const districtIds = new Map<string, number>();
  for (const d of DISTRICTS) {
    const existing = await db.select().from(localities).where(eq(localities.code, d.code)).limit(1);
    if (existing[0]) districtIds.set(d.code, existing[0].id);
    else {
      const [r] = await db.insert(localities).values({ code: d.code, name: d.name, localName: d.local, level: "district", parentId: stateIds.get(d.state)!, lat: d.lat, lng: d.lng }).returning({ id: localities.id });
      districtIds.set(d.code, r.id);
    }
  }
  for (const a of AREAS) {
    const existing = await db.select().from(localities).where(eq(localities.code, a.code)).limit(1);
    if (!existing[0]) await db.insert(localities).values({ code: a.code, name: a.name, localName: a.local, level: "city", parentId: districtIds.get(a.district)!, lat: a.lat, lng: a.lng });
  }
  let sort = 0;
  for (const c of CATEGORIES) {
    const existing = await db.select().from(categories).where(eq(categories.code, c.code)).limit(1);
    let id = existing[0]?.id;
    if (!id) {
      const [r] = await db.insert(categories).values({ code: c.code, slug: c.slug, name: c.name, sort: sort }).returning({ id: categories.id });
      id = r.id;
    }
    sort++;
    await db.insert(categoryTranslations).values({ categoryId: id, language: "ml", name: c.ml }).onConflictDoNothing();
  }
  const result = await importCourtsCsv(COURT_CSV);
  if (result.errors.length) throw new Error(`court seed failed: ${result.errors.map((e) => e.message).join("; ")}`);
  const all = await db.select().from(courts);
  for (const c of all) {
    if (c.localName) await db.insert(courtTranslations).values({ courtId: c.id, language: "ml", name: c.localName }).onConflictDoNothing();
    const details = c.importKey ? COURT_DETAILS[c.importKey] : undefined;
    if (details) {
      const have = await db.select({ id: courtDetails.id }).from(courtDetails).where(eq(courtDetails.courtId, c.id)).limit(1);
      if (!have[0]) await db.insert(courtDetails).values(details.map((d, i) => ({ courtId: c.id, sort: i, keyName: d.key, value: d.value })));
    }
  }
  return { courts: all.length };
}

/** Made-up sample pages so a fresh environment has something to browse. */
export async function seedDemo(): Promise<{ pages: number }> {
  const db = getDb();
  const cats = new Map((await db.select().from(categories)).map((c) => [c.code, c.id]));
  const courtByKey = new Map((await db.select().from(courts)).map((c) => [c.importKey!, c.id]));
  const dist = new Map((await db.select().from(localities)).map((l) => [l.code, l.id]));
  const slugToId = new Map<string, number>();
  let created = 0;
  for (const d of DEMO_PAGES) {
    const existing = await db.select().from(pages).where(eq(pages.slug, d.slug)).limit(1);
    if (existing[0]) {
      slugToId.set(d.slug, existing[0].id);
      continue;
    }
    const acc = await findOrCreateAccount(d.mobile);
    if (acc.isNew) await recordConsent(acc.id, "mobile_login");
    const page = await createPage(acc.id, {
      type: d.type, name: d.name, slug: d.slug, districtId: dist.get(d.district)!,
      enrolmentNo: d.enrolmentNo, yearEnrolled: d.yearEnrolled, establishedYear: d.establishedYear,
    });
    await db.update(pages).set({ plan: d.plan }).where(eq(pages.id, page.id));
    const fresh = (await db.select().from(pages).where(eq(pages.id, page.id)).limit(1))[0];
    await updatePage(fresh, { bio: d.bio, about: d.about ?? null });
    for (const code of d.categories) await addListItem(fresh, "categories", { categoryId: cats.get(code)! });
    for (const key of d.courts) await addListItem(fresh, "courts", { courtId: courtByKey.get(key)! });
    for (const l of d.languages) await addListItem(fresh, "languages", { languageCode: l });
    for (const c of d.career ?? []) await addListItem(fresh, "career", { ...c, description: null });
    for (const c of d.cases ?? []) await addListItem(fresh, "cases", { courtId: courtByKey.get(c.court)!, role: c.role, year: c.year, outcome: c.outcome, note: c.note ?? null });
    for (const h of d.highlights ?? []) if (d.plan !== "basic") await addListItem(fresh, "highlights", h);
    for (const o of d.offices ?? []) {
      const area = (await db.select().from(localities).where(eq(localities.code, o.area)).limit(1))[0];
      await addListItem(fresh, "offices", { name: o.name, address: o.address, localityId: area?.id ?? null, about: o.about, lat: o.lat, lng: o.lng, courtIds: (o.courts ?? []).map((k) => courtByKey.get(k)!).filter(Boolean) });
    }
    slugToId.set(d.slug, page.id);
    created++;
  }
  for (const p of DEMO_POSTS) {
    const id = slugToId.get(p.page);
    if (!id) continue;
    await createPost(id, "article", { title: p.title, body: p.body, language: "en", categoryIds: p.categories.map((c) => cats.get(c)!), courtId: p.court ? courtByKey.get(p.court)! : null, sourceUrl: null });
  }
  for (const u of DEMO_UPDATES) {
    const id = u.page ? slugToId.get(u.page) : undefined;
    if (id) await createPost(id, "court_update", { title: u.title, body: u.body, language: "en", categoryIds: [], courtId: courtByKey.get(u.court)!, sourceUrl: u.source });
    else await db.insert((await import("./schema")).posts).values({ pageId: null, type: "court_update", title: u.title, body: u.body, courtId: courtByKey.get(u.court)!, sourceUrl: u.source, language: "en" });
  }
  // Memberships in the sample firm
  const firm = slugToId.get("menon-associates");
  if (firm) {
    for (const [slug, title] of [["rahul-nair-adv", "Partner"], ["sneha-pillai", "Associate"]] as const) {
      const adv = slugToId.get(slug);
      if (!adv) continue;
      const advPage = (await db.select().from(pages).where(eq(pages.id, adv)).limit(1))[0];
      try {
        const m = await requestToJoin(advPage, firm, title, null);
        await decide(m, "firm", true);
      } catch {
        /* already a member on a re-run */
      }
    }
  }
  for (const id of slugToId.values()) await refreshPage(id);
  return { pages: created };
}
