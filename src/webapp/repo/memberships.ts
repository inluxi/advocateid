import { and, asc, eq, inArray, isNull, or, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import { memberships, offices, pageCategories, pages } from "@/db/schema";
import { MAX_FIRMS_PER_ADVOCATE, entitlementsFor, limitFor } from "@/lib/entitlements";
import { DomainError, getPage, type PageRow } from "./pages";
import { rebuildSearchIndex } from "./search";

export type Membership = typeof memberships.$inferSelect;
const live = isNull(memberships.deletedAt);
const open = inArray(memberships.status, ["pending", "active"]);

async function checkOffice(firmPageId: number, officeId: number | null | undefined) {
  if (!officeId) return null;
  const [o] = await getDb().select({ id: offices.id }).from(offices).where(and(eq(offices.id, officeId), eq(offices.pageId, firmPageId), isNull(offices.deletedAt))).limit(1);
  if (!o) throw new DomainError("office_invalid", "Choose one of the firm's offices.");
  return officeId;
}

async function lawyerSlotsLeft(firm: PageRow): Promise<boolean> {
  const limit = limitFor(firm.plan, "lawyers");
  if (!Number.isFinite(limit)) return true;
  const [r] = await getDb().select({ n: sql<number>`count(*)::int` }).from(memberships).where(and(eq(memberships.firmPageId, firm.id), open, live));
  return (r?.n ?? 0) < limit;
}

async function nextFirmSort(firmPageId: number): Promise<number> {
  const [r] = await getDb().select({ m: sql<number>`coalesce(max(${memberships.firmSort}), -1)::int` }).from(memberships).where(and(eq(memberships.firmPageId, firmPageId), live));
  return (r?.m ?? -1) + 1;
}

/** The advocate asks to join a firm (firm needs a plan that approves lawyers). */
export async function requestToJoin(advocate: PageRow, firmPageId: number, title: string, officeId: number | null): Promise<Membership> {
  const db = getDb();
  const firm = await getPage(firmPageId);
  if (advocate.type !== "advocate") throw new DomainError("not_advocate", "Only advocate pages can join a firm.");
  if (!firm || firm.type !== "firm" || firm.status !== "active") throw new DomainError("firm_not_found", "Firm not found.", 404);
  if (!entitlementsFor(firm.plan).approveLawyers) throw new DomainError("firm_not_accepting", "This firm adds lawyers by invitation.", 409);
  const dup = await db.select({ id: memberships.id }).from(memberships).where(and(eq(memberships.firmPageId, firmPageId), eq(memberships.advocatePageId, advocate.id), open, live)).limit(1);
  if (dup[0]) throw new DomainError("duplicate", "You already belong to or have asked to join this firm.", 409);
  const [mine] = await db.select({ n: sql<number>`count(*)::int` }).from(memberships).where(and(eq(memberships.advocatePageId, advocate.id), open, live));
  if ((mine?.n ?? 0) >= MAX_FIRMS_PER_ADVOCATE) throw new DomainError("firm_limit", `An advocate can be in up to ${MAX_FIRMS_PER_ADVOCATE} firms.`, 409);
  if (!(await lawyerSlotsLeft(firm))) throw new DomainError("lawyer_limit", "This firm has no free lawyer slots on its plan.", 409);
  const office = await checkOffice(firmPageId, officeId);
  const [row] = await db.insert(memberships).values({ firmPageId, advocatePageId: advocate.id, title, officeId: office, status: "pending", initiatedBy: "advocate", firmSort: await nextFirmSort(firmPageId) }).returning();
  return row;
}

/** The firm owner invites an advocate page (any plan). The advocate's approval is their consent. */
export async function inviteLawyer(firm: PageRow, advocatePageId: number, title: string, officeId: number | null): Promise<Membership> {
  const db = getDb();
  const adv = await getPage(advocatePageId);
  if (firm.type !== "firm") throw new DomainError("not_firm", "Only firm pages can invite lawyers.");
  if (!adv || adv.type !== "advocate" || adv.status !== "active") throw new DomainError("advocate_not_found", "Advocate page not found.", 404);
  const dup = await db.select({ id: memberships.id }).from(memberships).where(and(eq(memberships.firmPageId, firm.id), eq(memberships.advocatePageId, advocatePageId), open, live)).limit(1);
  if (dup[0]) throw new DomainError("duplicate", "This advocate is already a member or invited.", 409);
  if (!(await lawyerSlotsLeft(firm))) throw new DomainError("lawyer_limit", "Your plan has no free lawyer slots.", 409);
  const office = await checkOffice(firm.id, officeId);
  const [row] = await db.insert(memberships).values({ firmPageId: firm.id, advocatePageId, title, officeId: office, status: "pending", initiatedBy: "firm", firmSort: await nextFirmSort(firm.id) }).returning();
  return row;
}

export async function getMembership(id: number): Promise<Membership | null> {
  const [r] = await getDb().select().from(memberships).where(and(eq(memberships.id, id), live)).limit(1);
  return r ?? null;
}

/** Decide on a pending membership. Requests (from advocates) are decided by the firm; invites (from firms) by the advocate. */
export async function decide(m: Membership, side: "firm" | "advocate", approve: boolean): Promise<void> {
  if (m.status !== "pending") throw new DomainError("not_pending", "This request has already been decided.", 409);
  const decider = m.initiatedBy === "advocate" ? "firm" : "advocate";
  if (side !== decider) throw new DomainError("forbidden", "You cannot decide on this request.", 403);
  await getDb().update(memberships).set({ status: approve ? "active" : "rejected", updatedAt: new Date() }).where(eq(memberships.id, m.id));
  if (approve) await rebuildSearchIndex(m.firmPageId);
}

/** The advocate can leave at any time; the firm can remove at any time. */
export async function endMembership(m: Membership, by: "advocate" | "firm"): Promise<void> {
  await getDb().update(memberships).set({ status: by === "advocate" ? "left" : "removed", updatedAt: new Date() }).where(eq(memberships.id, m.id));
}

export async function updateMembership(m: Membership, patch: { title?: string; officeId?: number | null; intro?: string | null }): Promise<void> {
  const set: Partial<typeof memberships.$inferInsert> = { updatedAt: new Date() };
  if (patch.title !== undefined) set.title = patch.title;
  if (patch.officeId !== undefined) set.officeId = await checkOffice(m.firmPageId, patch.officeId);
  if (patch.intro !== undefined) set.intro = patch.intro;
  await getDb().update(memberships).set(set).where(eq(memberships.id, m.id));
}

export async function hideOnDomain(m: Membership, hide: boolean): Promise<void> {
  await getDb().update(memberships).set({ hideOnDomain: hide, updatedAt: new Date() }).where(eq(memberships.id, m.id));
}

/** Arrows at firm level or office level. */
export async function moveLawyer(firmPageId: number, membershipId: number, direction: "up" | "down", scope: "firm" | "office"): Promise<void> {
  const db = getDb();
  const col = scope === "firm" ? memberships.firmSort : memberships.officeSort;
  const all = await db.select().from(memberships).where(and(eq(memberships.firmPageId, firmPageId), eq(memberships.status, "active"), live)).orderBy(asc(col), asc(memberships.id));
  const target = all.find((m) => m.id === membershipId);
  if (!target) throw new DomainError("not_found", "Lawyer not found.", 404);
  const group = scope === "office" ? all.filter((m) => m.officeId === target.officeId) : all;
  const idx = group.findIndex((m) => m.id === membershipId);
  const j = direction === "up" ? idx - 1 : idx + 1;
  if (j < 0 || j >= group.length) return;
  const arr = [...group];
  [arr[idx], arr[j]] = [arr[j], arr[idx]];
  await db.transaction(async (tx) => {
    for (let k = 0; k < arr.length; k++) await tx.update(memberships).set(scope === "firm" ? { firmSort: k } : { officeSort: k }).where(eq(memberships.id, arr[k].id));
  });
}

export interface LawyerView {
  membership: Membership;
  page: PageRow;
  categories: number[];
}

/** Active lawyers of a firm, in the owner's order, limited by the firm's plan. */
export async function listLawyers(firm: PageRow, opts: { forOwner?: boolean; officeId?: number; forDomain?: boolean } = {}): Promise<{ items: LawyerView[]; hidden: number }> {
  const db = getDb();
  const conds: any[] = [eq(memberships.firmPageId, firm.id), eq(memberships.status, "active"), live];
  if (opts.officeId) conds.push(eq(memberships.officeId, opts.officeId));
  if (opts.forDomain) conds.push(eq(memberships.hideOnDomain, false));
  const rows = await db
    .select()
    .from(memberships)
    .where(and(...conds))
    .orderBy(asc(opts.officeId ? memberships.officeSort : memberships.firmSort), asc(memberships.id));
  const limit = limitFor(firm.plan, "lawyers");
  const visible = !opts.forOwner && Number.isFinite(limit) ? rows.slice(0, limit) : rows;
  const pageRows = visible.length ? await db.select().from(pages).where(and(inArray(pages.id, visible.map((m) => m.advocatePageId)), isNull(pages.deletedAt), eq(pages.status, "active"))) : [];
  const pmap = new Map(pageRows.map((p) => [p.id, p]));
  const cats = visible.length ? await db.select().from(pageCategories).where(and(inArray(pageCategories.pageId, visible.map((m) => m.advocatePageId)), isNull(pageCategories.deletedAt))).orderBy(asc(pageCategories.sort)) : [];
  const items = visible
    .filter((m) => pmap.has(m.advocatePageId))
    .map((m) => ({ membership: m, page: pmap.get(m.advocatePageId)!, categories: cats.filter((c) => c.pageId === m.advocatePageId).map((c) => c.categoryId) }));
  return { items, hidden: Math.max(0, rows.length - visible.length) };
}

export interface FirmView {
  membership: Membership;
  firm: PageRow;
}

/** "Member of" list on an advocate page. */
export async function listFirmsOf(advocatePageId: number): Promise<FirmView[]> {
  const db = getDb();
  const rows = await db.select().from(memberships).where(and(eq(memberships.advocatePageId, advocatePageId), eq(memberships.status, "active"), live)).orderBy(asc(memberships.id));
  if (!rows.length) return [];
  const firms = await db.select().from(pages).where(and(inArray(pages.id, rows.map((r) => r.firmPageId)), isNull(pages.deletedAt), eq(pages.status, "active")));
  const fmap = new Map(firms.map((f) => [f.id, f]));
  return rows.filter((r) => fmap.has(r.firmPageId)).map((r) => ({ membership: r, firm: fmap.get(r.firmPageId)! }));
}

/** Pending items waiting for this account (requests for its firms, invites for its advocates). */
export async function pendingFor(pageIds: number[]): Promise<{ requests: (Membership & { advocateName: string; firmName: string })[]; invites: (Membership & { advocateName: string; firmName: string })[] }> {
  if (!pageIds.length) return { requests: [], invites: [] };
  const db = getDb();
  const rows = await db.select().from(memberships).where(and(eq(memberships.status, "pending"), live, or(inArray(memberships.firmPageId, pageIds), inArray(memberships.advocatePageId, pageIds))));
  const ids = [...new Set(rows.flatMap((r) => [r.firmPageId, r.advocatePageId]))];
  const prows = ids.length ? await db.select({ id: pages.id, name: pages.name }).from(pages).where(inArray(pages.id, ids)) : [];
  const nm = new Map(prows.map((p) => [p.id, p.name]));
  const dec = rows.map((r) => ({ ...r, advocateName: nm.get(r.advocatePageId) ?? "", firmName: nm.get(r.firmPageId) ?? "" }));
  return {
    requests: dec.filter((r) => r.initiatedBy === "advocate" && pageIds.includes(r.firmPageId)),
    invites: dec.filter((r) => r.initiatedBy === "firm" && pageIds.includes(r.advocatePageId)),
  };
}

