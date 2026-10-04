import { notFound } from "next/navigation";
import { requireUser } from "./auth-guard";
import { getPage, listAccountPages, type PageRow } from "@/repo/pages";

/** Owner gate for /manage/{pageId}/...: the page must belong to the signed-in account. */
export async function loadOwned(pageIdParam: string, next: string): Promise<{ page: PageRow; pages: PageRow[]; accountId: number }> {
  const session = await requireUser(next);
  const id = Number(pageIdParam);
  if (!Number.isInteger(id)) notFound();
  const page = await getPage(id);
  if (!page || page.accountId !== session.accountId) notFound();
  return { page, pages: await listAccountPages(session.accountId), accountId: session.accountId };
}
