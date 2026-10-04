import { NextResponse, type NextRequest } from "next/server";
import { config as appConfig } from "@/lib/config";
import { classifyHost } from "@/lib/host";
import { VISITOR_COOKIE, VISITOR_HEADER, isFreshVisitorValue, newVisitorValue } from "@/lib/visitor";

/**
 * 1. Host routing: any host that is not advocateid.in (custom domain, or {slug}.p.advocateid.in) is rewritten
 *    to the internal /sites/{host}/... tree, so the same app serves Premium sites with root-path links only.
 * 2. Language: /ml/... is rewritten to the same page with x-lang=ml (no automatic switching, ever).
 * 3. Rotating random visitor id (new value every day; never derived from IP or device).
 */
export function proxy(req: NextRequest) {
  const host = (req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "").toLowerCase().split(":")[0];
  const kind = classifyHost(host);
  const url = req.nextUrl.clone();
  const path = url.pathname;
  const headers = new Headers(req.headers);
  headers.set("x-path", path + url.search);
  headers.delete("x-lang"); // the language comes only from the URL prefix, never from a request header

  // The internal tree is never reachable directly
  if (path === "/sites" || path.startsWith("/sites/")) {
    return new NextResponse("Not found", { status: 404 });
  }

  let vid = req.cookies.get(VISITOR_COOKIE)?.value;
  let fresh = false;
  if (!isFreshVisitorValue(vid)) {
    vid = newVisitorValue(crypto.randomUUID().replace(/-/g, ""));
    fresh = true;
  }
  headers.set(VISITOR_HEADER, vid!);

  let res: NextResponse;
  if (kind.kind === "custom" || kind.kind === "target") {
    url.pathname = `/sites/${encodeURIComponent(host)}${path === "/" ? "" : path}`;
    res = NextResponse.rewrite(url, { request: { headers } });
  } else if (path === "/ml" || path.startsWith("/ml/")) {
    headers.set("x-lang", "ml");
    url.pathname = path === "/ml" ? "/" : path.slice(3);
    res = NextResponse.rewrite(url, { request: { headers } });
  } else {
    res = NextResponse.next({ request: { headers } });
  }
  if (fresh) {
    res.cookies.set(VISITOR_COOKIE, vid!, { httpOnly: true, sameSite: "lax", secure: appConfig.isProd, path: "/", maxAge: 86400 });
  }
  return res;
}

export const config = {
  // Pages, robots.txt and sitemap.xml (they must reach custom domains too); not API routes, Next internals, uploads or static assets
  matcher: ["/((?!api/|_next/|uploads/|connect/|icons/|favicon|sw\\.js|offline\\.html|.*\\.(?:png|jpg|jpeg|svg|webp|ico|css|js|map|webmanifest|woff2?)$).*)"],
};
