/** Environment access in one place. No secrets are ever hard-coded or logged. */

const isProd = () => process.env.NODE_ENV === "production";

export const config = {
  get siteOrigin(): string {
    return (process.env.SITE_ORIGIN ?? "http://localhost:3000").replace(/\/$/, "");
  },
  get rootDomain(): string {
    return process.env.ROOT_DOMAIN ?? "advocateid.in";
  },
  get appSecret(): string {
    const s = process.env.APP_SECRET;
    if (s && s.length >= 32) return s;
    if (isProd()) throw new Error("APP_SECRET must be set (32+ characters)");
    return "dev-only-secret-dev-only-secret-dev-only";
  },
  get smsProvider(): string {
    return process.env.SMS_PROVIDER ?? "console";
  },
  get storageProvider(): string {
    return process.env.STORAGE_PROVIDER ?? "local";
  },
  get storagePublicBase(): string {
    return process.env.STORAGE_PUBLIC_BASE ?? "/uploads";
  },
  get adminMobiles(): string[] {
    return (process.env.ADMIN_MOBILES ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  },
  get jobToken(): string | undefined {
    return process.env.JOB_TOKEN || undefined;
  },
  get isProd(): boolean {
    return isProd();
  },
};

/** Hostnames that serve the main site (everything else is a candidate custom domain). */
export function isMainHost(host: string): boolean {
  const h = host.toLowerCase().split(":")[0];
  const root = config.rootDomain.toLowerCase();
  if (h === root || h === `www.${root}`) return true;
  if (h === "localhost" || h === "127.0.0.1") return true;
  try {
    const origin = new URL(config.siteOrigin).hostname.toLowerCase();
    if (h === origin) return true;
  } catch {
    /* ignore */
  }
  return false;
}
