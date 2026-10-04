import { cookies, headers } from "next/headers";
import { detectBot, VISITOR_COOKIE, VISITOR_HEADER } from "./visitor";
import { normaliseHost } from "./host";
import { BOOKMARK_COOKIE, COMPARE_COOKIE, getSession } from "./session";
import { listBookmarkIds } from "@/repo/bookmarks";
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
    visitorId: vid.split(".")[1] ?? vid, // rotating random id, never tied to the account
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

/** Compare ticks (cookie) and bookmarks (cookie for visitors, database after login) for rendering cards. */
export async function getSavedIds(): Promise<{ compare: number[]; bookmarks: number[] }> {
  const jar = await cookies();
  const parse = (v: string | undefined) => (v ? v.split(".").map(Number).filter((n) => Number.isInteger(n) && n > 0) : []);
  const compare = parse(jar.get(COMPARE_COOKIE)?.value).slice(0, 3);
  const session = await getSession();
  const bookmarks = session ? await listBookmarkIds(session.accountId) : parse(jar.get(BOOKMARK_COOKIE)?.value);
  return { compare, bookmarks };
}
