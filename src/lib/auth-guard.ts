import { redirect } from "next/navigation";
import { getSession } from "./session";
import type { SessionInfo } from "@/repo/auth";

/** Server-side gate for /account, /manage and /admin pages. */
export async function requireUser(next: string): Promise<SessionInfo> {
  const s = await getSession();
  if (!s) redirect(`/login?next=${encodeURIComponent(next)}`);
  return s;
}

export async function requireAdmin(): Promise<SessionInfo> {
  const s = await requireUser("/admin");
  if (s.role !== "admin") redirect("/account");
  return s;
}
