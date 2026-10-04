import { route, csrfTokenFor } from "@/lib/api";
import { listAccountPages } from "@/repo/pages";

export const GET = route(async ({ session }) => {
  if (!session) return { authenticated: false };
  const pages = await listAccountPages(session.accountId);
  return {
    authenticated: true,
    isAdmin: session.role === "admin",
    csrfToken: csrfTokenFor(session),
    actingPageId: session.actingPageId,
    pages: pages.map((p) => ({ id: p.id, name: p.name, slug: p.slug, type: p.type, plan: p.plan, status: p.status, completeness: p.completeness })),
  };
});
