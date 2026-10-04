/**
 * Bar Council wording check (rules/bar-council-wording.md, Rule 36).
 * Used by the live editor (client and server). Matching is case-insensitive and
 * respects word boundaries: "bestow" and "bestseller" are not flagged.
 */

export interface BannedPhrase {
  phrase: string;
  suggestion: string;
}

const NONE = "leave it out";

export const BANNED_PHRASES: BannedPhrase[] = [
  { phrase: "best", suggestion: NONE },
  { phrase: "top", suggestion: NONE },
  { phrase: "leading", suggestion: NONE },
  { phrase: "number one", suggestion: NONE },
  { phrase: "#1", suggestion: NONE },
  { phrase: "famous", suggestion: NONE },
  { phrase: "expert in", suggestion: 'use "practises in" or "works on"' },
  { phrase: "expert", suggestion: 'use "practises in" or "works on"' },
  { phrase: "specialist", suggestion: 'use "practises in"' },
  { phrase: "guaranteed", suggestion: NONE },
  { phrase: "guarantee", suggestion: NONE },
  { phrase: "won", suggestion: 'state facts: "Represented the petitioner"' },
  { phrase: "winning", suggestion: 'use "represented"' },
  { phrase: "100% success", suggestion: 'state facts: "Outcome: petition allowed"' },
  { phrase: "success rate", suggestion: NONE },
  { phrase: "successful", suggestion: NONE },
  { phrase: "landmark", suggestion: NONE },
  { phrase: "historic", suggestion: NONE },
  { phrase: "cheap", suggestion: NONE },
  { phrase: "discount", suggestion: NONE },
  { phrase: "hire", suggestion: 'use "Connect"' },
  { phrase: "book now", suggestion: 'use "Connect"' },
  { phrase: "book", suggestion: 'use "Connect"' },
  { phrase: "reliable", suggestion: NONE },
  { phrase: "most", suggestion: NONE },
  { phrase: "popular", suggestion: NONE },
  { phrase: "busy", suggestion: NONE },
  { phrase: "trusted by", suggestion: NONE },
  { phrase: "highly rated", suggestion: NONE },
  { phrase: "satisfied clients", suggestion: NONE },
  { phrase: "beloved by clients", suggestion: NONE },
  { phrase: "client testimonials", suggestion: NONE },
  { phrase: "client reviews", suggestion: NONE },
  { phrase: "testimonial", suggestion: NONE },
  { phrase: "testimonials", suggestion: NONE },
  { phrase: "star ratings", suggestion: NONE },
  { phrase: "star rating", suggestion: NONE },
  { phrase: "5-star", suggestion: NONE },
  { phrase: "5 star", suggestion: NONE },
  { phrase: "five star", suggestion: NONE },
  { phrase: "before and after", suggestion: "text only: court, year, outcome" },
  { phrase: "before/after", suggestion: "text only: court, year, outcome" },
  { phrase: "case photos", suggestion: NONE },
  { phrase: "fee", suggestion: NONE },
  { phrase: "fees", suggestion: NONE },
  { phrase: "price", suggestion: NONE },
  { phrase: "prices", suggestion: NONE },
];

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// A "word character" is any letter, number or combining mark (so Malayalam works).
const W = "[\\p{L}\\p{N}\\p{M}_]";

const COMPILED = BANNED_PHRASES.map((b) => ({
  ...b,
  re: new RegExp(`(?<!${W})${escapeRe(b.phrase).replace(/\\? /g, "\\s+")}(?!${W})`, "iu"),
}));

export interface WordingResult {
  flagged: boolean;
  found: { phrase: string; suggestion: string }[];
}

export function checkWording(text: string | null | undefined): WordingResult {
  if (!text) return { flagged: false, found: [] };
  const found: { phrase: string; suggestion: string }[] = [];
  let remaining = text;
  // Longer phrases first so "expert in" is reported once, not also as "expert".
  for (const b of [...COMPILED].sort((a, c) => c.phrase.length - a.phrase.length)) {
    if (b.re.test(remaining)) {
      found.push({ phrase: b.phrase, suggestion: b.suggestion });
      remaining = remaining.replace(new RegExp(b.re.source, "giu"), " ");
    }
  }
  return { flagged: found.length > 0, found };
}

export function checkAll(fields: Record<string, string | null | undefined>): Record<string, WordingResult> {
  const out: Record<string, WordingResult> = {};
  for (const [k, v] of Object.entries(fields)) {
    const r = checkWording(v);
    if (r.flagged) out[k] = r;
  }
  return out;
}

const BOOKING_URL = /(book|hire|order|get-?started|discount|offer|coupon)/i;

/** Links must not carry booking or discount language (rules 3.8). */
export function urlHasBookingLanguage(url: string): boolean {
  return BOOKING_URL.test(url);
}

/** Human message for the editor. */
export function describeFlags(result: WordingResult): string {
  return result.found.map((f) => `"${f.phrase}" (${f.suggestion})`).join(", ");
}
