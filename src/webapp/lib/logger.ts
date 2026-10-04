/**
 * Safe logging (DPDP checklist section 11): never log mobiles, OTPs, names,
 * IP addresses, tokens or free text. Log event names, ids and error classes only.
 */

const MOBILE = /(\+?91[\s-]?)?[6-9]\d{9}\b/g;
const TOKEN = /[A-Fa-f0-9]{32,}/g;
const EMAIL = /[^\s@]+@[^\s@]+\.[^\s@]+/g;

export function redact(input: string): string {
  return input.replace(MOBILE, "[mobile]").replace(EMAIL, "[email]").replace(TOKEN, "[token]");
}

type Fields = Record<string, string | number | boolean | null | undefined>;

function emit(level: "info" | "warn" | "error", event: string, fields?: Fields) {
  const safe: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(fields ?? {})) {
    safe[k] = typeof v === "string" ? redact(v).slice(0, 200) : v;
  }
  const line = JSON.stringify({ level, event, ...safe, at: new Date().toISOString() });
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

export const log = {
  info: (event: string, fields?: Fields) => emit("info", event, fields),
  warn: (event: string, fields?: Fields) => emit("warn", event, fields),
  /** Pass the error object; only its class name is recorded, never its message. */
  error: (event: string, err?: unknown, fields?: Fields) =>
    emit("error", event, { ...fields, error: err instanceof Error ? err.name : "UnknownError" }),
};
