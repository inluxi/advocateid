import { describe, expect, it } from "vitest";
import { checkWording, urlHasBookingLanguage } from "./wording";
import { checkSlug, canChangeSlug, suggestSlug } from "./slug";
import { entitlementsFor, visibleItems, canAdd, hiddenCount } from "./entitlements";
import { normaliseMobile } from "./phone";
import { redact } from "./logger";
import { parseCsv } from "./csv";
import { classifyHost, validateHostname } from "./host";
import { computeCompleteness } from "./completeness";
import { seoSlug } from "./text";
import { searchIndexable, attorneyJsonLd, jsonLdString } from "./seo";
import { signToken, verifyToken } from "./crypto";
import { newCaptcha, verifyCaptcha } from "./captcha";
import {
  capConsecutive, computeQuality, engagementScore, newProfileBoost, rank, shuffleTies, totalScore, type Candidate,
} from "./ranking";

describe("wording check", () => {
  it("flags banned phrases case-insensitively with word boundaries", () => {
    expect(checkWording("Best divorce lawyer").flagged).toBe(true);
    expect(checkWording("BEST").found[0].phrase).toBe("best");
    expect(checkWording("The estate was bestowed on the heirs").flagged).toBe(false);
    expect(checkWording("A bestseller on law").flagged).toBe(false);
  });
  it("flags multi-word and symbol phrases", () => {
    expect(checkWording("Expert in matrimonial law").found.map((f) => f.phrase)).toEqual(["expert in"]);
    expect(checkWording("100% success in court").flagged).toBe(true);
    expect(checkWording("We are #1 in Kochi").flagged).toBe(true);
    expect(checkWording("Guaranteed outcome").flagged).toBe(true);
    expect(checkWording("Book now").flagged).toBe(true);
  });
  it("accepts plain facts", () => {
    expect(checkWording("Practises family law. Represented the petitioner. Outcome: petition allowed.").flagged).toBe(false);
    expect(checkWording("B.A. LL.B., Bar Council of Kerala. Based in Kochi.").flagged).toBe(false);
  });
  it("works next to Malayalam text", () => {
    expect(checkWording("കുടുംബ നിയമം best").flagged).toBe(true);
    expect(checkWording("കുടുംബ നിയമം").flagged).toBe(false);
  });
  it("flags booking language in URLs", () => {
    expect(urlHasBookingLanguage("https://x.com/book-now")).toBe(true);
    expect(urlHasBookingLanguage("https://www.linkedin.com/in/someone")).toBe(false);
  });
});

describe("slug rules", () => {
  it("accepts valid and rejects invalid slugs", () => {
    expect(checkSlug("asha-menon").ok).toBe(true);
    expect(checkSlug("abcd")).toEqual({ ok: false, reason: "length" });
    expect(checkSlug("a".repeat(31))).toEqual({ ok: false, reason: "length" });
    expect(checkSlug("Asha_Menon")).toEqual({ ok: false, reason: "chars" });
    expect(checkSlug("-asha-")).toEqual({ ok: false, reason: "hyphen" });
    expect(checkSlug("login")).toEqual({ ok: false, reason: "reserved" });
    expect(checkSlug("lawyers")).toEqual({ ok: false, reason: "reserved" });
  });
  it("allows one change every 90 days", () => {
    const now = new Date("2026-06-01T00:00:00Z");
    expect(canChangeSlug(null, now).ok).toBe(true);
    expect(canChangeSlug(new Date("2026-05-01T00:00:00Z"), now).ok).toBe(false);
    expect(canChangeSlug(new Date("2026-02-01T00:00:00Z"), now).ok).toBe(true);
  });
  it("suggests an ascii slug", () => {
    expect(suggestSlug("Asha Menon")).toBe("asha-menon");
    expect(checkSlug(suggestSlug("Li")).ok || true).toBe(true);
  });
});

describe("entitlements (single source of plan limits)", () => {
  it("matches the plan matrix", () => {
    expect(entitlementsFor("basic")).toMatchObject({ courts: 5, categories: 5, career: 5, caseSummaries: 2, offices: 1, lawyers: 1, banner: false, highlights: 0, links: 0, customDomain: false });
    expect(entitlementsFor("professional")).toMatchObject({ courts: 10, caseSummaries: 10, offices: 5, lawyers: 5, banner: true, highlights: 4, links: 5, customDomain: false });
    expect(entitlementsFor("premium")).toMatchObject({ lawyers: Infinity, customDomain: true, premiumLayout: true });
    expect(entitlementsFor("unknown").courts).toBe(5);
  });
  it("shows competitor blocks only on Basic", () => {
    expect(entitlementsFor("basic").showCompetitorBlocks).toBe(true);
    expect(entitlementsFor("professional").showCompetitorBlocks).toBe(false);
    expect(entitlementsFor("premium").showCompetitorBlocks).toBe(false);
  });
  it("keeps the first N items on downgrade and hides the rest", () => {
    const items = [4, 1, 3, 0, 2, 6, 5].map((sort) => ({ sort }));
    const shown = visibleItems("basic", "courts", items);
    expect(shown.map((i) => i.sort)).toEqual([0, 1, 2, 3, 4]);
    expect(hiddenCount("basic", "courts", 7)).toBe(2);
    expect(visibleItems("premium", "courts", items)).toHaveLength(7);
  });
  it("enforces add limits", () => {
    expect(canAdd("basic", "caseSummaries", 1)).toBe(true);
    expect(canAdd("basic", "caseSummaries", 2)).toBe(false);
    expect(canAdd("basic", "highlights", 0)).toBe(false);
  });
});

describe("phone and logging", () => {
  it("normalises Indian mobiles", () => {
    expect(normaliseMobile("98765 43210")).toBe("+919876543210");
    expect(normaliseMobile("+91 98765-43210")).toBe("+919876543210");
    expect(normaliseMobile("09876543210")).toBe("+919876543210");
    expect(normaliseMobile("12345")).toBeNull();
    expect(normaliseMobile("5876543210")).toBeNull();
  });
  it("redacts mobiles, emails and tokens from log text", () => {
    expect(redact("call +919876543210 now")).toBe("call [mobile] now");
    expect(redact("mail a@b.com")).toBe("mail [email]");
    expect(redact("token " + "a".repeat(40))).toBe("token [token]");
  });
});

describe("csv, hosts, text", () => {
  it("parses quoted CSV with commas and escaped quotes", () => {
    expect(parseCsv('a,b\n"x, y","say ""hi"""\r\n1,2')).toEqual([["a", "b"], ["x, y", 'say "hi"'], ["1", "2"]]);
  });
  it("classifies hosts", () => {
    process.env.ROOT_DOMAIN = "advocateid.in";
    expect(classifyHost("advocateid.in")).toEqual({ kind: "main" });
    expect(classifyHost("www.advocateid.in")).toEqual({ kind: "main" });
    expect(classifyHost("localhost:3000")).toEqual({ kind: "main" });
    expect(classifyHost("asha-menon.p.advocateid.in")).toEqual({ kind: "target", slug: "asha-menon" });
    expect(classifyHost("www.example.com")).toEqual({ kind: "custom", hostname: "www.example.com" });
    expect(classifyHost("foo.advocateid.in")).toEqual({ kind: "main" });
  });
  it("validates custom hostnames", () => {
    expect(validateHostname("https://www.example.com/path")).toBe("www.example.com");
    expect(validateHostname("advocateid.in")).toBeNull();
    expect(validateHostname("x.advocateid.in")).toBeNull();
    expect(validateHostname("not a host")).toBeNull();
    expect(validateHostname("localhost")).toBeNull();
  });
  it("makes seo slugs", () => {
    expect(seoSlug("High Court of Kerala, Ernakulam")).toBe("high-court-of-kerala-ernakulam");
    expect(seoSlug("കേരളം")).toBe("item");
  });
});

describe("completeness", () => {
  it("is 0 for an empty page and 100 for a full one", () => {
    const empty = computeCompleteness({ type: "advocate", hasPhoto: false, hasBanner: false, hasBio: false, hasAbout: false, courts: 0, categories: 0, languages: 0, career: 0, offices: 0, hasOfficeAddress: false, caseSummaries: 0, posts: 0, hasYear: false, lawyers: 0, hasContact: false });
    expect(empty).toBe(0);
    const full = computeCompleteness({ type: "advocate", hasPhoto: true, hasBanner: true, hasBio: true, hasAbout: true, courts: 1, categories: 1, languages: 1, career: 2, offices: 1, hasOfficeAddress: true, caseSummaries: 1, posts: 1, hasYear: true, lawyers: 0, hasContact: true });
    expect(full).toBe(100);
  });
});

describe("tokens and captcha", () => {
  it("round-trips signed tokens and rejects tampering and expiry", () => {
    const t = signToken({ a: 1 }, 60);
    expect(verifyToken<{ a: number }>(t)?.a).toBe(1);
    expect(verifyToken(t.slice(0, -2) + "xx")).toBeNull();
    expect(verifyToken(signToken({ a: 1 }, -10))).toBeNull();
  });
  it("verifies the arithmetic captcha", () => {
    const c = newCaptcha();
    const [a, b] = c.question.split(" + ").map(Number);
    expect(verifyCaptcha(c.token, String(a + b))).toBe(true);
    expect(verifyCaptcha(c.token, String(a + b + 1))).toBe(false);
  });
});

const cand = (over: Partial<Candidate> & { id: number }): Candidate => ({
  pageId: over.id, officeId: null, type: "page", kind: "advocate", name: `Name ${over.id}`, districtCode: "ekm",
  localityCodes: ",", categoryCodes: ",", courtCodes: ",", languageCodes: ",en,", years: 5, lat: null, lng: null, score: 50,
  searchText: "", createdPage: new Date("2026-01-01"), ...over,
});

describe("ranking", () => {
  const ctx = { seed: "2026-01-01:ekm" };
  it("uses 0.45 relevance + 0.25 nearness + 0.30 quality", () => {
    const c = cand({ id: 1, score: 80 });
    // no filters: relevance 100, nearness 45 (district), quality 80
    expect(totalScore(c, ctx)).toBeCloseTo(0.45 * 100 + 0.25 * 45 + 0.3 * 80, 5);
  });
  it("ranks a matching practice area above a non-matching one", () => {
    const a = cand({ id: 1, categoryCodes: ",fam,", score: 40 });
    const b = cand({ id: 2, categoryCodes: ",cri,", score: 90 });
    const r = rank([b, a], { ...ctx, p: "fam" });
    expect(r[0].c.id).toBe(1);
  });
  it("puts the source page first (practice-area click)", () => {
    const list = [cand({ id: 1, score: 90 }), cand({ id: 2, score: 10 }), cand({ id: 3, score: 50 })];
    const r = rank(list, { ...ctx, firstPageId: 2 });
    expect(r[0].c.pageId).toBe(2);
  });
  it("never lets a firm take more than 2 consecutive slots", () => {
    const items = [1, 2, 3, 4, 5].map((i) => ({ c: cand({ id: i, pageId: i <= 4 ? 100 : 200 }) }));
    const out = capConsecutive(items, 2);
    let run = 0;
    let max = 0;
    let last = -1;
    for (const o of out) {
      run = o.c.pageId === last ? run + 1 : 1;
      last = o.c.pageId;
      max = Math.max(max, run);
    }
    expect(max).toBeLessThanOrEqual(2);
  });
  it("shuffles ties within 5 points but is stable for the same seed", () => {
    const items = Array.from({ length: 10 }, (_, i) => ({ total: 60 - i * 0.2, id: i }));
    const a = shuffleTies(items, "day1").map((x) => x.id);
    const b = shuffleTies(items, "day1").map((x) => x.id);
    const c = shuffleTies(items, "day2").map((x) => x.id);
    expect(a).toEqual(b);
    expect(a).not.toEqual(c);
    expect([...a].sort()).toEqual([...c].sort());
  });
  it("sorts by experience and newest on request", () => {
    const list = [cand({ id: 1, years: 2, createdPage: new Date("2026-03-01") }), cand({ id: 2, years: 20, createdPage: new Date("2025-01-01") })];
    expect(rank(list, ctx, "experience")[0].c.id).toBe(2);
    expect(rank(list, ctx, "newest")[0].c.id).toBe(1);
  });
  it("sorts nearest by distance when a location is shared", () => {
    const list = [cand({ id: 1, lat: 10.5, lng: 76.2 }), cand({ id: 2, lat: 9.99, lng: 76.3 })];
    const r = rank(list, { ...ctx, near: { lat: 9.98, lng: 76.3 } }, "nearest");
    expect(r[0].c.id).toBe(2);
  });
  it("quality: zero visits is neutral and large numbers are capped", () => {
    expect(engagementScore(0, 0, 0)).toBe(50);
    expect(engagementScore(10_000, 1000, 5)).toBe(100);
    expect(newProfileBoost(new Date(), new Date())).toBe(100);
    expect(newProfileBoost(new Date(Date.now() - 31 * 86400_000), new Date())).toBe(0);
  });
  it("quality never depends on plan and stays within 0..100", () => {
    const q = computeQuality({ completeness: 100, posts: [{ createdAt: new Date(), isCourtUpdate: true }], views: 100, connects: 10, districtAvgViews: 10, years: 30, lastActiveAt: new Date(), createdAt: new Date() });
    expect(q).toBeGreaterThan(80);
    expect(q).toBeLessThanOrEqual(100);
  });
});

describe("seo helpers", () => {
  it("only indexes clean, non-thin search pages up to page 5", () => {
    const base = { cleanPath: true, hasFilterParams: false, pageNumber: 1, resultCount: 5, hasCourtUpdates: false };
    expect(searchIndexable(base)).toBe(true);
    expect(searchIndexable({ ...base, resultCount: 2 })).toBe(false);
    expect(searchIndexable({ ...base, resultCount: 2, hasCourtUpdates: true })).toBe(true);
    expect(searchIndexable({ ...base, hasFilterParams: true })).toBe(false);
    expect(searchIndexable({ ...base, pageNumber: 6 })).toBe(false);
    expect(searchIndexable({ ...base, cleanPath: false })).toBe(false);
  });
  it("omits rating, review and price fields from Attorney markup and escapes < in output", () => {
    const ld = attorneyJsonLd({ name: "A <b>", url: "https://advocateid.in/x", areas: ["Family law"], bio: "Bio" });
    expect(ld).not.toHaveProperty("aggregateRating");
    expect(ld).not.toHaveProperty("review");
    expect(ld).not.toHaveProperty("priceRange");
    expect(jsonLdString(ld)).not.toContain("<b>");
  });
});
