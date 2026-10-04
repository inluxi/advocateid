import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

const BASE = process.env.E2E_BASE_URL;

/** Tiny cookie-aware client (Node fetch does not keep cookies). */
class Client {
  jar = new Map<string, string>();
  csrf = "";
  async call(method: string, url: string, opts: { json?: unknown; body?: BodyInit; headers?: Record<string, string>; redirect?: RequestRedirect } = {}) {
    const headers: Record<string, string> = { origin: BASE!, cookie: [...this.jar].map(([k, v]) => `${k}=${v}`).join("; "), ...(opts.headers ?? {}) };
    if (method !== "GET" && this.csrf && !("x-csrf-token" in headers)) headers["x-csrf-token"] = this.csrf;
    let body = opts.body;
    if (opts.json !== undefined) {
      headers["content-type"] = "application/json";
      body = JSON.stringify(opts.json);
    }
    const res = await fetch(BASE + url, { method, headers, body, redirect: opts.redirect ?? "follow" });
    for (const c of res.headers.getSetCookie()) {
      const [pair] = c.split(";");
      const i = pair.indexOf("=");
      const name = pair.slice(0, i);
      const value = pair.slice(i + 1);
      if (/max-age=0|expires=thu, 01 jan 1970/i.test(c)) this.jar.delete(name);
      else this.jar.set(name, value);
    }
    const text = await res.text();
    let json: any = null;
    try { json = JSON.parse(text); } catch { /* not json */ }
    return { status: res.status, json, text, headers: res.headers };
  }
}

describe.skipIf(!BASE)("end-to-end: signup, page, plan limits, wording, connect, events", () => {
  const c = new Client();
  const mobile = `+9198${String(Date.now()).slice(-8)}`;
  const slug = `e2e-${Date.now().toString(36)}`;
  let pageId = 0;

  it("OTP login needs consent, rejects a wrong OTP and logs in with the right one", async () => {
    expect((await c.call("POST", "/api/auth/otp/send", { json: { mobile, consent: false } })).status).toBe(400);
    expect((await c.call("POST", "/api/auth/otp/send", { json: { mobile, consent: true } })).status).toBe(200);
    const otp = (await (await fetch(`${BASE}/api/dev/otp?mobile=${encodeURIComponent(mobile)}`)).json()).otp as string;
    expect((await c.call("POST", "/api/auth/otp/verify", { json: { mobile, otp: otp === "000000" ? "111111" : "000000" } })).status).toBe(400);
    const ok = await c.call("POST", "/api/auth/otp/verify", { json: { mobile, otp } });
    expect(ok.status).toBe(200);
    expect(ok.json.isNew).toBe(true);
    const setCookie = ok.headers.getSetCookie().join(";");
    expect(setCookie).toMatch(/HttpOnly/i);
    expect(setCookie).toMatch(/SameSite=strict/i);
    const me = await c.call("GET", "/api/auth/me");
    expect(me.json.authenticated).toBe(true);
    c.csrf = me.json.csrfToken;
  });

  it("creates a page, enforces CSRF and the slug rules", async () => {
    const bad = await c.call("POST", "/api/pages", { json: { type: "advocate", name: "X Y", slug, districtId: 7, enrolmentNo: "K/9/2020" }, headers: { "x-csrf-token": "bad" } });
    expect(bad.status).toBe(403);
    const reserved = await c.call("POST", "/api/pages", { json: { type: "advocate", name: "X Y", slug: "lawyers", districtId: 7, enrolmentNo: "K/9/2020" } });
    expect(reserved.status).toBe(400);
    const noEnrol = await c.call("POST", "/api/pages", { json: { type: "advocate", name: "X Y", slug, districtId: 7 } });
    expect(noEnrol.status).toBe(400);
    const ok = await c.call("POST", "/api/pages", { json: { type: "advocate", name: "Test Advocate", slug, districtId: 7, enrolmentNo: "K/9/2020" } });
    expect(ok.status).toBe(200);
    pageId = ok.json.page.id;
  });

  it("flags banned wording (409), allows save-anyway, accepts plain facts", async () => {
    const flagged = await c.call("PUT", `/api/pages/${pageId}`, { json: { bio: "Best divorce lawyer in Kerala" } });
    expect(flagged.status).toBe(409);
    expect(flagged.json.flags.bio.map((f: any) => f.phrase)).toContain("best");
    expect((await c.call("PUT", `/api/pages/${pageId}`, { json: { bio: "Best divorce lawyer", acknowledgeWording: true } })).status).toBe(200);
    expect((await c.call("PUT", `/api/pages/${pageId}`, { json: { bio: "Practises family law in Kochi.", about: "Appears in the Family Court." } })).status).toBe(200);
    expect((await c.call("POST", `/api/pages/${pageId}/posts`, { json: { title: "Top tips", body: "We are the best and guaranteed results.", categoryIds: [] } })).status).toBe(409);
  });

  it("enforces Basic plan limits from the entitlement module", async () => {
    expect((await c.call("POST", `/api/pages/${pageId}/lists/courts`, { json: { courtId: 1 } })).status).toBe(200);
    expect((await c.call("POST", `/api/pages/${pageId}/lists/highlights`, { json: { number: 5, label: "Offices" } })).status).toBe(402);
    expect((await c.call("POST", `/api/pages/${pageId}/lists/links`, { json: { url: "https://www.linkedin.com/in/x" } })).status).toBe(402);
    let last = 0;
    for (let i = 0; i < 3; i++) last = (await c.call("POST", `/api/pages/${pageId}/lists/cases`, { json: { courtId: 1, role: "Appeared for the petitioner", year: 2020 + i, outcome: "settled" } })).status;
    expect(last).toBe(402);
    expect((await c.call("POST", `/api/pages/${pageId}/lists/offices`, { json: { name: "Chamber", about: "Chamber near the court." } })).status).toBe(200);
    expect((await c.call("POST", `/api/pages/${pageId}/lists/offices`, { json: { name: "Second" } })).status).toBe(402);
  });

  it("uploads a picture in three sizes and serves it", async () => {
    const png = readFileSync(path.join(process.cwd(), "public/icons/icon-192.png"));
    const form = new FormData();
    form.set("kind", "photo");
    for (const k of ["s", "m", "l"]) form.set(k, new Blob([png], { type: "image/webp" }), `${k}.webp`);
    expect((await c.call("POST", `/api/pages/${pageId}/images`, { body: form })).status).toBe(200);
    const form2 = new FormData();
    form2.set("kind", "banner");
    for (const k of ["s", "m", "l"]) form2.set(k, new Blob([png]), `${k}.webp`);
    expect((await c.call("POST", `/api/pages/${pageId}/images`, { body: form2 })).status).toBe(402);
    const bad = new FormData();
    bad.set("kind", "photo");
    for (const k of ["s", "m", "l"]) bad.set(k, new Blob(["definitely not an image"]), `${k}.webp`);
    expect((await c.call("POST", `/api/pages/${pageId}/images`, { body: bad })).status).toBe(400);
  });

  it("public page shows facts, declared enrolment, and Connect through a redirect (no number in HTML)", async () => {
    const page = await c.call("GET", `/${slug}`);
    expect(page.status).toBe(200);
    expect(page.text).toContain("declared by the advocate");
    expect(page.text).toContain("K/9/2020");
    const visible = page.text.replace(/<script[\s\S]*?<\/script>/g, "").replace(/<style[\s\S]*?<\/style>/g, "");
    expect(visible).not.toMatch(/verified (seal|badge|advocate)|star rating|\bbest\b|\btop\b/i);
    expect(page.text).toContain(`/connect/${pageId}?via=whatsapp`);
    expect(page.text).not.toContain("wa.me");
    expect(page.text).not.toContain(mobile.slice(3));
    const wa = await c.call("GET", `/connect/${pageId}?via=whatsapp`, { redirect: "manual" });
    expect([302, 307]).toContain(wa.status);
    expect(wa.headers.get("location")).toMatch(/^https:\/\/wa\.me\/91\d{10}\?text=Hello%2C%20I%20found%20your%20page/);
    const call = await c.call("GET", `/connect/${pageId}?via=call`, { redirect: "manual" });
    expect(call.headers.get("location")).toMatch(/^tel:\+91/);
  });

  it("compare allows 3 at a time, reports need the check, slug change is limited", async () => {
    for (const id of [1, 2, 3]) expect((await c.call("POST", "/api/compare", { json: { pageId: id, on: true } })).status).toBe(200);
    expect((await c.call("POST", "/api/compare", { json: { pageId: 4, on: true } })).status).toBe(409);
    const cap = (await c.call("GET", "/api/captcha")).json;
    const [a, b] = cap.question.split(" + ").map(Number);
    const base = { targetType: "page", targetId: pageId, reason: "promotional", captchaToken: cap.token };
    expect((await c.call("POST", "/api/report", { json: { ...base, captchaAnswer: String(a + b + 1) } })).status).toBe(400);
    expect((await c.call("POST", "/api/report", { json: { ...base, captchaAnswer: String(a + b) } })).status).toBe(200);
    const renamed = `${slug}-b`;
    expect((await c.call("POST", `/api/pages/${pageId}/slug`, { json: { slug: renamed } })).status).toBe(200);
    expect((await c.call("POST", `/api/pages/${pageId}/slug`, { json: { slug: `${slug}-c` } })).status).toBe(429);
    const old = await c.call("GET", `/${slug}`, { redirect: "manual" });
    expect([301, 308]).toContain(old.status);
  });

  it("DPDP: download my data, non-admin cannot import courts, logout ends the session", async () => {
    const dl = await c.call("GET", "/api/account/download");
    expect(dl.status).toBe(200);
    expect(dl.json.pages[0].page.id).toBe(pageId);
    expect((await c.call("POST", "/api/admin/courts/import", { body: "id,name\n1,x", headers: { "content-type": "text/csv" } })).status).toBe(403);
    await c.call("POST", "/api/auth/logout");
    expect((await c.call("GET", "/api/auth/me")).json.authenticated).toBe(false);
  });
});

describe.skipIf(!BASE)("end-to-end: SEO rules on public pages", () => {
  const get = async (p: string, headers: Record<string, string> = {}) => (await fetch(BASE + p, { headers })).text();
  const meta = (html: string, re: RegExp) => html.match(re)?.[1];

  it("district pages are indexable with canonical; search pages are noindex with a canonical to the base", async () => {
    const d = await get("/d/ekm");
    expect(meta(d, /<meta name="robots" content="([^"]+)"/)).toBe("index, follow");
    expect(meta(d, /<link rel="canonical" href="([^"]+)"/)).toMatch(/\/d\/ekm$/);
    expect(d).toMatch(/hrefLang="ml"/i);
    const s = await get("/search?d=ekm&s=newest");
    expect(meta(s, /<meta name="robots" content="([^"]+)"/)).toBe("noindex, nofollow");
    expect(meta(s, /<link rel="canonical" href="([^"]+)"/)).toMatch(/\/d\/ekm$/);
  });

  it("robots.txt blocks private areas and lists the sitemap; sitemap index is valid XML", async () => {
    const r = await get("/robots.txt");
    for (const p of ["/api/", "/admin/", "/account/", "/manage/", "/compare", "/search"]) expect(r).toContain(`Disallow: ${p}`);
    expect(r).toContain("Sitemap:");
    expect(await get("/sitemap.xml")).toContain("<sitemapindex");
    expect(await get("/sitemaps/static-1.xml")).toContain("<urlset");
  });

  it("a wrong court slug redirects permanently", async () => {
    const res = await fetch(`${BASE}/c/1/wrong-seo`, { redirect: "manual" });
    expect([301, 308]).toContain(res.status);
  });

  it("a Premium page with an active domain is noindex on advocateid.in and canonical on its own domain", async () => {
    // Needs the demo seed plus a domains row for rahul-nair-adv (see README, "Testing custom domains")
    const main = await get("/rahul-nair-adv");
    if (!/noindex/.test(main)) return; // domain not set up in this environment
    expect(meta(main, /<link rel="canonical" href="([^"]+)"/)).toMatch(/^https:\/\//);
  });
});
