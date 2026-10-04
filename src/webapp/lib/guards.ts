import type { SessionInfo } from "@/repo/auth";
import { audit } from "@/repo/moderation";
import { DomainError, getPage, type PageRow } from "@/repo/pages";
import { ApiError } from "./api";
import { checkAll } from "./wording";

/** The page must belong to the signed-in account. */
export async function ownedPage(session: SessionInfo, pageId: number): Promise<PageRow> {
  if (!Number.isInteger(pageId) || pageId <= 0) throw new ApiError(404, "not_found");
  const page = await getPage(pageId);
  if (!page || page.accountId !== session.accountId) throw new ApiError(404, "not_found");
  return page;
}

export const intParam = (v: string): number => {
  const n = Number(v);
  if (!Number.isInteger(n) || n <= 0) throw new ApiError(404, "not_found");
  return n;
};

/**
 * Live wording check on save (Bar Council Rule 36). Flagged text is reported back with a 409;
 * the owner may save anyway by sending acknowledgeWording. Flags are logged (phrases only, never the text) for admin review.
 */
export async function wordingGate(
  session: SessionInfo,
  resource: { type: string; id: number },
  fields: Record<string, string | null | undefined>,
  acknowledged: boolean | undefined,
): Promise<void> {
  const flagged = checkAll(fields);
  const names = Object.keys(flagged);
  if (!names.length) return;
  await audit({
    action: "wording_flagged",
    resourceType: resource.type,
    resourceId: String(resource.id),
    actorId: session.accountId,
    actorType: "user",
    reason: names.map((n) => `${n}: ${flagged[n].found.map((f) => f.phrase).join("|")}`).join("; ") + (acknowledged ? " (saved anyway)" : ""),
  });
  if (!acknowledged) {
    throw new ApiError(409, "wording_flagged", "This text contains wording that Bar Council rules do not allow.", {
      flags: Object.fromEntries(names.map((n) => [n, flagged[n].found])),
    });
  }
}

/** Map repository errors to API errors. */
export function mapDomainError(e: unknown): never {
  if (e instanceof DomainError) throw new ApiError(e.status, e.code, e.message);
  throw e;
}

export async function guard<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (e) {
    return mapDomainError(e);
  }
}
