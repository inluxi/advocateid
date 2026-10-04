import { config, isMainHost } from "./config";

export type HostKind =
  | { kind: "main" }
  | { kind: "target"; slug: string } // {slug}.p.advocateid.in (hidden CNAME target)
  | { kind: "custom"; hostname: string };

export function normaliseHost(raw: string | null | undefined): string {
  return (raw ?? "").toLowerCase().split(":")[0].trim();
}

export function classifyHost(rawHost: string | null | undefined): HostKind {
  const host = normaliseHost(rawHost);
  if (!host || isMainHost(host)) return { kind: "main" };
  const suffix = `.p.${config.rootDomain.toLowerCase()}`;
  if (host.endsWith(suffix)) {
    const slug = host.slice(0, -suffix.length);
    if (slug && !slug.includes(".")) return { kind: "target", slug };
  }
  // Other subdomains of the root domain are not custom domains
  if (host.endsWith(`.${config.rootDomain.toLowerCase()}`)) return { kind: "main" };
  return { kind: "custom", hostname: host };
}

/** CNAME target shown to the owner in /manage/{id}/domain. */
export const cnameTarget = (slug: string) => `${slug}.p.${config.rootDomain}`;

const HOSTNAME_RE = /^(?=.{4,253}$)([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/;

export function validateHostname(input: string): string | null {
  const h = input.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
  if (!HOSTNAME_RE.test(h)) return null;
  const root = config.rootDomain.toLowerCase();
  if (h === root || h.endsWith(`.${root}`)) return null;
  return h;
}
