import { entitlementsFor } from "./entitlements";

/** Premium with an active custom domain: that domain is canonical and advocateid.in/{slug} stays out of search engines. */
export function domainCanonical(plan: string, activeDomain: string | null | undefined, path: string): string | null {
  if (!activeDomain || !entitlementsFor(plan).customDomain) return null;
  return `https://${activeDomain}${path === "/" ? "/" : path}`;
}
