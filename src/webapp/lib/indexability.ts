import { courtsOfDistrict } from "@/repo/reference-extra";
import { countIndexed } from "@/repo/search";
import { countCourtUpdates } from "@/repo/posts";
import { searchIndexable } from "./seo";

/** Thin pages (fewer than 3 advocates and no court update) are noindex. */
export async function isListingIndexable(opts: { d?: string; p?: string; c?: string; l?: string; districtId?: number; courtId?: number; hasExtra: boolean; page: number }): Promise<boolean> {
  const n = await countIndexed({ d: opts.d, p: opts.p, c: opts.c, l: opts.l });
  let updates = 0;
  if (opts.courtId) updates = await countCourtUpdates(opts.courtId);
  else if (opts.districtId) updates = await countCourtUpdates(undefined, await courtsOfDistrict(opts.districtId));
  return searchIndexable({ cleanPath: true, hasFilterParams: opts.hasExtra, pageNumber: opts.page, resultCount: n, hasCourtUpdates: updates > 0 });
}
