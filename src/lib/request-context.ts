import { cookies, headers } from "next/headers";
import { detectBot, VISITOR_COOKIE, VISITOR_HEADER } from "./visitor";
import { normaliseHost } from "./host";
import { getSession } from "./session";
import { listAccountPages } from "@/repo/pages";

export interface VisitorInfo {
  visitorId: string;
  host: string;
  isBot: boolean;
  accountId: number | null;
}

/** Who is looking: rotating visitor id (set by proxy.ts), the host, a bot flag and the signed-in account (if any). */
export async function getVisitor(): Promise<VisitorInfo> {
  const h = await headers();
  const jar = await cookies();
  const session = await getSession();
  const host = normaliseHost(h.get("x-forwarded-host") ?? h.get("host"));
  const vid = h.get(VISITOR_HEADER) ?? jar.get(VISITOR_COOKIE)?.value ?? "none";
  return {
    visitorId: session ? `acct-${session.accountId}-${vid.slice(0, 10)}` : vid.split(".")[1] ?? vid,
    host,
    isBot: detectBot(h.get("user-agent")),
    accountId: session?.accountId ?? null,
  };
}

/** Owner flag: the viewer's account owns the page being viewed. */
export async function isOwnerOf(pageAccountId: number): Promise<boolean> {
  const s = await getSession();
  return !!s && s.accountId === pageAccountId;
}

export async function accountPageIds(accountId: number | null): Promise<number[]> {
  return accountId ? (await listAccountPages(accountId)).map((p) => p.id) : [];
}
