import { NextResponse, type NextRequest } from "next/server";
import { and, eq, isNull } from "drizzle-orm";
import { getDb } from "@/db/client";
import { offices } from "@/db/schema";
import { absolute } from "@/lib/url";
import { makeT, isLang } from "@/lib/i18n";
import { telUrl, whatsappUrl } from "@/lib/phone";
import { getVisitor } from "@/lib/request-context";
import { getSession } from "@/lib/session";
import { classifyHost } from "@/lib/host";
import { recordEvent } from "@/repo/analytics";
import { getPage } from "@/repo/pages";
import { getDomainForPage } from "@/repo/domains";
import { entitlementsFor } from "@/lib/entitlements";

export const dynamic = "force-dynamic";

/**
 * Connect: records the tap (per host) and redirects to WhatsApp or the phone dialler.
 * The number is never put in a page URL or in our own links (DPDP: no mobile numbers in URLs).
 */
export async function GET(req: NextRequest, rc: { params: Promise<{ pageId: string }> }) {
  const id = Number((await rc.params).pageId);
  const page = Number.isInteger(id) ? await getPage(id) : null;
  if (!page || page.status !== "active") return new NextResponse("Not found", { status: 404 });

  const sp = req.nextUrl.searchParams;
  const via = sp.get("via") === "call" ? "call" : "whatsapp";
  const officeId = Number(sp.get("office")) || null;
  let mobile = page.contactMobile;
  if (officeId) {
    const [o] = await getDb().select().from(offices).where(and(eq(offices.id, officeId), eq(offices.pageId, page.id), isNull(offices.deletedAt))).limit(1);
    if (o?.phone && o.phoneVerified) mobile = o.phone; // the office page uses the office number, otherwise the page number
  }
  if (!mobile) return new NextResponse("No contact number", { status: 404 });

  const visitor = await getVisitor();
  const session = await getSession();
  await recordEvent({
    pageId: page.id,
    host: visitor.host || "advocateid.in",
    visitorId: visitor.visitorId,
    eventType: "connect",
    context: officeId ? "office" : "page",
    action: via,
    isOwner: !!session && session.accountId === page.accountId,
    isBot: visitor.isBot,
  });

  if (via === "call") return NextResponse.redirect(telUrl(mobile), 302);

  // Premium uses its own domain in the message; the text follows the page language
  const dom = entitlementsFor(page.plan).customDomain ? await getDomainForPage(page.id) : null;
  const host = classifyHost(visitor.host);
  const address = dom?.status === "active" ? `https://${dom.hostname}/` : host.kind === "custom" ? `https://${host.hostname}/` : absolute(`/${page.slug}`);
  const lang = isLang(page.language) ? page.language : "en";
  return NextResponse.redirect(whatsappUrl(mobile, makeT(lang)("connect.whatsapp_text", { address })), 302);
}
