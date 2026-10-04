import { randomInt } from "node:crypto";
import { lookupHash, signToken, verifyToken } from "./crypto";
import { randomToken } from "./crypto";

/** Small arithmetic challenge for public forms (report, grievance, contact). No third-party script, no tracking. */
export function newCaptcha(): { question: string; token: string } {
  const a = randomInt(2, 10);
  const b = randomInt(2, 10);
  const nonce = randomToken(8);
  const token = signToken({ n: nonce, h: lookupHash(`${nonce}:${a + b}`) }, 15 * 60);
  return { question: `${a} + ${b}`, token };
}

export function verifyCaptcha(token: string, answer: string): boolean {
  const data = verifyToken<{ n: string; h: string }>(token);
  if (!data) return false;
  return lookupHash(`${data.n}:${answer.trim()}`) === data.h;
}
