import { after } from "next/server";
import type { Card } from "@/repo/search";
import { recordImpressions } from "@/repo/analytics";
import { accountPageIds, getVisitor } from "./request-context";

/** An impression: a page appears in a list, search result or similar block. Recorded after the response is sent. */
export async function trackImpressions(cards: Pick<Card, "pageId">[], context: string): Promise<void> {
  if (!cards.length) return;
  const v = await getVisitor();
  const mine = new Set(await accountPageIds(v.accountId));
  const owned = cards.filter((c) => mine.has(c.pageId));
  const others = cards.filter((c) => !mine.has(c.pageId));
  after(async () => {
    const base = { host: v.host || "advocateid.in", visitorId: v.visitorId, context, isBot: v.isBot, action: null };
    if (others.length) await recordImpressions(others.map((c) => c.pageId), { ...base, isOwner: false });
    if (owned.length) await recordImpressions(owned.map((c) => c.pageId), { ...base, isOwner: true });
  });
}
