import type { Post } from "@/repo/posts";
import { getPagesByIds } from "@/repo/pages";
import { courtNames } from "@/repo/reference";
import type { Lang } from "./i18n";

/** Author pages and court names for a list of posts (one query each). */
export async function postContext(list: Post[], lang: Lang) {
  const authors = new Map((await getPagesByIds([...new Set(list.map((p) => p.pageId).filter((x): x is number => !!x))])).filter((p) => p.status === "active").map((p) => [p.id, { name: p.name, slug: p.slug }]));
  const courts = await courtNames(lang, [...new Set(list.map((p) => p.courtId).filter((x): x is number => !!x))]);
  return { authors, courts };
}
