/**
 * The ONE place that knows what each plan allows (AGENTS.md section 4).
 * Components and repositories ask this module; they never hard-code limits.
 * Plans never affect ranking.
 */

export type Plan = "basic" | "professional" | "premium";
export type PageType = "advocate" | "firm";

export const PLANS: Plan[] = ["basic", "professional", "premium"];

export type ListKey = "courts" | "categories" | "career" | "caseSummaries" | "offices" | "lawyers" | "highlights" | "links";

export interface Entitlements {
  banner: boolean;
  courts: number;
  categories: number;
  career: number;
  caseSummaries: number;
  offices: number;
  lawyers: number;
  highlights: number;
  links: number;
  /** Basic pages show nearby/similar advocates on their own page; others hide them. */
  showCompetitorBlocks: boolean;
  approveLawyers: boolean;
  memberOfToggle: boolean;
  customDomain: boolean;
  premiumLayout: boolean;
  proLayout: boolean;
}

const UNLIMITED = Number.POSITIVE_INFINITY;

const MATRIX: Record<Plan, Entitlements> = {
  basic: {
    banner: false, courts: 5, categories: 5, career: 5, caseSummaries: 2, offices: 1, lawyers: 1, highlights: 0, links: 0,
    showCompetitorBlocks: true, approveLawyers: false, memberOfToggle: false, customDomain: false, premiumLayout: false, proLayout: false,
  },
  professional: {
    banner: true, courts: 10, categories: 10, career: 10, caseSummaries: 10, offices: 5, lawyers: 5, highlights: 4, links: 5,
    showCompetitorBlocks: false, approveLawyers: true, memberOfToggle: false, customDomain: false, premiumLayout: false, proLayout: true,
  },
  premium: {
    banner: true, courts: 10, categories: 10, career: 10, caseSummaries: 10, offices: 5, lawyers: UNLIMITED, highlights: 4, links: 5,
    showCompetitorBlocks: false, approveLawyers: true, memberOfToggle: true, customDomain: true, premiumLayout: true, proLayout: true,
  },
};

export const PLAN_PRICES: Record<Plan, { month: number; year: number }> = {
  basic: { month: 0, year: 0 },
  professional: { month: 599, year: 6000 },
  premium: { month: 999, year: 10000 },
};

export function isPlan(v: unknown): v is Plan {
  return v === "basic" || v === "professional" || v === "premium";
}

export function entitlementsFor(plan: string): Entitlements {
  return MATRIX[isPlan(plan) ? plan : "basic"];
}

export function limitFor(plan: string, list: ListKey): number {
  return entitlementsFor(plan)[list];
}

/** Can another item be added to this list? */
export function canAdd(plan: string, list: ListKey, currentCount: number): boolean {
  return currentCount < limitFor(plan, list);
}

/**
 * Downgrade rule: keep the first N items in the owner's order and hide the rest.
 * Nothing is deleted; upgrading again brings the hidden items back.
 */
export function visibleItems<T extends { sort: number }>(plan: string, list: ListKey, items: T[]): T[] {
  const limit = limitFor(plan, list);
  const ordered = [...items].sort((a, b) => a.sort - b.sort);
  return Number.isFinite(limit) ? ordered.slice(0, limit) : ordered;
}

export function hiddenCount(plan: string, list: ListKey, total: number): number {
  const limit = limitFor(plan, list);
  return Number.isFinite(limit) ? Math.max(0, total - limit) : 0;
}

export const MAX_PAGES_PER_ACCOUNT = 3;
export const MAX_FIRMS_PER_ADVOCATE = 5;
export const BIO_MAX = 500;
export const ABOUT_MAX = 5000;
export const NOTE_MAX = 200;
export const INTRO_MAX = 200;
export const OFFICE_ABOUT_MAX = 200;
export const POST_BODY_MAX = 10000;
export const UPDATE_BODY_MAX = 5000;
export const MAX_POST_CATEGORIES = 3;
