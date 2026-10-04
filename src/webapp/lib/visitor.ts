/**
 * Rotating random visitor id (DPDP): a new random value every day, never derived from IP, mobile or device.
 * The cookie is set by proxy.ts (a server component cannot set cookies); pages read it here.
 */
export const VISITOR_COOKIE = "aid_vid";
export const VISITOR_HEADER = "x-aid-vid";

export const today = (d = new Date()) => d.toISOString().slice(0, 10);

/** Cookie value format: YYYY-MM-DD.randomhex */
export function newVisitorValue(random: string, d = new Date()): string {
  return `${today(d)}.${random}`;
}

export function isFreshVisitorValue(v: string | undefined | null, d = new Date()): boolean {
  return !!v && /^\d{4}-\d{2}-\d{2}\.[a-f0-9]{16,64}$/.test(v) && v.startsWith(today(d));
}

const BOT_RE =
  /bot|crawler|spider|slurp|bingpreview|facebookexternalhit|whatsapp|telegram|preview|headless|lighthouse|pingdom|uptime|monitor|curl|wget|python-requests|httpclient|axios|go-http|java\/|okhttp|libwww|scrapy/i;

export function detectBot(userAgent: string | null | undefined): boolean {
  if (!userAgent) return true;
  return BOT_RE.test(userAgent);
}
