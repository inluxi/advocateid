import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { EN } from "@/lib/i18n";
import { checkWording } from "@/lib/wording";

function walk(dir: string, out: string[] = []): string[] {
  for (const f of readdirSync(dir)) {
    const p = path.join(dir, f);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(ts|tsx)$/.test(f) && !f.endsWith(".test.ts")) out.push(p);
  }
  return out;
}

const SRC = walk(path.join(process.cwd(), "src"));
const text = SRC.map((f) => readFileSync(f, "utf8")).join("\n");

/** Dynamic key families (built with template strings) and the values they take. */
const FAMILIES: Record<string, string[]> = {
  "plan.": ["basic", "professional", "premium"],
  "status.": ["active", "suspended", "deleted"],
  "sort.": ["nearest", "experience", "newest"],
  "pricing.layout.": ["basic", "professional", "premium"],
  "report.what.": ["page", "post", "update"],
  "report.reason.": ["promotional", "false_information", "unlawful", "privacy", "impersonation", "other"],
  "consent.": ["mobile_login", "terms", "office_phone"],
  "admin.grievance.": ["open", "in_progress", "resolved"],
  "domain.status.": ["pending", "active", "lapsed", "removed"],
  "contact.kind.": ["general", "court"],
  "image.error.": ["too_large", "not_an_image", "network", "generic"],
  "privacy.retention.": ["mobile", "otp", "pages", "events", "consents", "grievances", "contact"],
  "privacy.processor.": ["hosting", "db", "storage", "sms", "dns"],
};
for (const s of ["use", "content", "bar", "reports", "liability", "changes"]) (FAMILIES[`terms.${s}.`] ??= []).push("title", "body");
for (const s of ["collect", "purpose", "consent", "cookies", "retention", "rights", "children", "processors", "security", "breach"]) (FAMILIES[`privacy.${s}.`] ??= []).push("title", "body");

describe("translation files", () => {
  it("contain every key used in t(...) calls", () => {
    const used = new Set<string>();
    for (const m of text.matchAll(/\bt\(\s*"([a-z][^"]*)"/g)) used.add(m[1]);
    for (const m of text.matchAll(/\? t\("([^"]+)"\) : t\("([^"]+)"\)/g)) { used.add(m[1]); used.add(m[2]); }
    const missing = [...used].filter((k) => !(k in EN));
    expect(missing).toEqual([]);
  });
  it("contain every key of the dynamic families", () => {
    const missing: string[] = [];
    for (const [prefix, vals] of Object.entries(FAMILIES)) for (const v of vals) if (!(prefix + v in EN)) missing.push(prefix + v);
    expect(missing).toEqual([]);
  });
  it("public-facing text has no banned promotional wording", () => {
    // Legal text, the wording help itself and admin screens may name the banned ideas. "Most experienced" is an
    // allowed sort name (AGENTS.md section 3) and "Prices" on the pricing page are the platform's own plan prices.
    const skip = /^(wording\.|terms\.|privacy\.|about\.rules|admin\.|report\.reason|legal\.|footer\.disclaimer|search\.near_note|login\.notice|sort\.|pricing\.|editor\.links_hint)/;
    const flagged = Object.entries(EN).filter(([k, v]) => !skip.test(k) && checkWording(v).flagged).map(([k, v]) => `${k}: ${v}`);
    expect(flagged).toEqual([]);
  });
});
