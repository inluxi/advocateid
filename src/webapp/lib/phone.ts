/** Indian mobile numbers: stored as E.164 (+91XXXXXXXXXX). */

export function normaliseMobile(input: string): string | null {
  const digits = input.replace(/[\s\-().]/g, "");
  const m = digits.match(/^(?:\+?91|0)?([6-9]\d{9})$/);
  return m ? `+91${m[1]}` : null;
}

export const isValidMobile = (input: string) => normaliseMobile(input) !== null;

/** For display and for the grievance/consent screens only. */
export function maskMobile(e164: string): string {
  return e164.length < 6 ? "***" : `${e164.slice(0, 3)}******${e164.slice(-2)}`;
}

/** wa.me wants digits only, no plus. Built server-side and only used in a redirect, never in a page URL. */
export function whatsappUrl(e164: string, text: string): string {
  return `https://wa.me/${e164.replace(/\D/g, "")}?text=${encodeURIComponent(text)}`;
}

export const telUrl = (e164: string) => `tel:${e164}`;
