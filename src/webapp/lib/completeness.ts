/** Completeness percentage (owner-only; feeds ranking quality). */

export interface CompletenessInput {
  type: "advocate" | "firm";
  hasPhoto: boolean;
  hasBanner: boolean;
  hasBio: boolean;
  hasAbout: boolean;
  courts: number;
  categories: number;
  languages: number;
  career: number;
  offices: number;
  hasOfficeAddress: boolean;
  caseSummaries: number;
  posts: number;
  hasYear: boolean; // year enrolled / established
  lawyers: number;
  hasContact: boolean;
}

export function computeCompleteness(i: CompletenessInput): number {
  let pts = 0;
  pts += i.hasPhoto ? 10 : 0;
  pts += i.hasBio ? 10 : 0;
  pts += i.hasAbout ? 10 : 0;
  pts += i.courts > 0 ? 10 : 0;
  pts += i.categories > 0 ? 10 : 0;
  pts += i.languages > 0 ? 5 : 0;
  pts += i.career > 0 ? 10 : 0;
  pts += i.offices > 0 && i.hasOfficeAddress ? 10 : 0;
  pts += i.caseSummaries > 0 ? 5 : 0;
  pts += i.posts > 0 ? 5 : 0;
  pts += i.hasYear ? 5 : 0;
  pts += i.hasContact ? 5 : 0;
  // Type-specific 5 points
  pts += i.type === "firm" ? (i.lawyers > 0 || i.hasBanner ? 5 : 0) : i.hasBanner || i.career > 1 ? 5 : 0;
  return Math.min(100, pts);
}
