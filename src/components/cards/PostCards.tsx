import Link from "next/link";
import type { Post } from "@/repo/posts";
import type { Lang, TFunction } from "@/lib/i18n";
import { formatDate } from "@/lib/format";
import { postPath, profilePath, updatePath, courtPath } from "@/lib/url";
import { truncate, stripHtml } from "@/lib/text";
import { Icon } from "@/components/Icon";

export interface PostAuthor {
  name: string;
  slug: string;
}

/** Post teaser. `base` keeps links on a custom domain ("" on advocateid.in). */
export function PostCard({ post, author, courtName, lang, t, href }: { post: Post; author?: PostAuthor | null; courtName?: string | null; lang: Lang; t: TFunction; href?: string }) {
  const link = href ?? (post.type === "court_update" ? updatePath(post, lang) : postPath(post, lang));
  return (
    <article className="card card-update">
      <h3><Link href={link}>{post.title}</Link></h3>
      <p className="muted" style={{ margin: 0 }}>{truncate(stripHtml(post.body), 150)}</p>
      <div className="meta-row">
        <span><Icon name="calendar" size="sm" />{formatDate(post.createdAt, lang)}</span>
        {courtName ? <span><Icon name="scale" size="sm" />{courtName}</span> : null}
        {post.type === "court_update" ? (
          <span>{author ? t("update.contributed_by", { name: author.name }) : t("update.official")}</span>
        ) : author ? (
          <span><Icon name="user" size="sm" />{author.name}</span>
        ) : null}
      </div>
    </article>
  );
}

export { courtPath, profilePath };
