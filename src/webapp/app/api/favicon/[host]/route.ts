import { NextResponse, type NextRequest } from "next/server";
import { clientKey } from "@/lib/api";
import { hit } from "@/lib/rate-limit";
import { assertPublicHost } from "@/lib/safe-fetch";
import { getStorage } from "@/lib/storage";

export const dynamic = "force-dynamic";

const FALLBACK = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#16213E" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></svg>';
const fallback = () => new NextResponse(FALLBACK, { headers: { "content-type": "image/svg+xml", "cache-control": "public, max-age=3600" } });

/** Link icon for sites without a known icon: the favicon is fetched once, stored and served from our storage. */
export async function GET(req: NextRequest, rc: { params: Promise<{ host: string }> }) {
  const host = (await rc.params).host.toLowerCase();
  if (!(await hit("favicon", clientKey(req), 60, 60)).ok) return fallback();
  const storage = await getStorage();
  const key = `favicons/${host}.ico`;
  const cached = await storage.get?.(key);
  const headers = { "cache-control": "public, max-age=2592000" };
  if (cached) return new NextResponse(new Uint8Array(cached), { headers: { ...headers, "content-type": "image/x-icon" } });
  if (!(await assertPublicHost(host))) return fallback();
  try {
    const res = await fetch(`https://${host}/favicon.ico`, { redirect: "error", signal: AbortSignal.timeout(3000), headers: { "user-agent": "AdvocateID-icon-fetch" } });
    const type = res.headers.get("content-type") ?? "";
    const buf = Buffer.from(await res.arrayBuffer());
    if (!res.ok || !/^image\//.test(type) || buf.length === 0 || buf.length > 100_000) return fallback();
    await storage.put(key, buf, type);
    return new NextResponse(new Uint8Array(buf), { headers: { ...headers, "content-type": type } });
  } catch {
    return fallback();
  }
}
