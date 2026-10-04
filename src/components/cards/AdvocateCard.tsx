import Link from "next/link";
import type { Card } from "@/repo/search";
import type { Lang, TFunction } from "@/lib/i18n";
import { officePath, profilePath } from "@/lib/url";
import { Avatar } from "@/components/ui/Avatar";
import { Icon } from "@/components/Icon";
import { BookmarkButton, CompareToggle } from "@/components/ui/ClientActions";

/**
 * One result card: photo, name, practice areas, Connect (WhatsApp) and the compare tick.
 * No "View profile" button, no enrolment number, no plan marker, no score.
 */
export function AdvocateCard({
  card, lang, t, compare, bookmarks, base = "",
}: {
  card: Card;
  lang: Lang;
  t: TFunction;
  compare: number[];
  bookmarks: number[];
  /** "" on advocateid.in; links stay on the custom domain when rendered there. */
  base?: string;
}) {
  const href = card.kind === "office" && card.officeId ? officePath(card.slug, { id: card.officeId, name: card.officeName ?? card.name }, lang) : profilePath(card.slug, lang);
  const title = card.kind === "office" ? (card.officeName ?? card.name) : card.name;
  return (
    <article className="card-pro" aria-label={title}>
      <Avatar name={card.name} photoKey={card.photoKey} size="s" />
      <div>
        <div className="pro-name">
          <Link href={`${base}${href}`}>{title}</Link>
        </div>
        {card.kind === "office" ? <div className="pro-desig">{card.name}</div> : null}
        {card.categories.length ? <div className="pro-desig">{card.categories.join(", ")}</div> : null}
        <div className="pro-meta">
          {card.district ? <span><Icon name="pin" size="sm" />{card.district}</span> : null}
          {card.years > 0 && card.kind !== "office" ? <span><Icon name="clock" size="sm" />{t("card.years", { n: card.years })}</span> : null}
          {card.kind === "firm" ? <span><Icon name="building" size="sm" />{t("card.firm")}</span> : null}
          {card.distanceKm != null ? <span>{t("card.km", { n: Math.round(card.distanceKm * 10) / 10 })}</span> : null}
          {card.isSource ? <span className="chip chip-brass">{t("card.source")}</span> : null}
        </div>
        {card.address ? <div className="pro-meta"><span>{card.address}</span></div> : null}
      </div>
      <div className="pro-actions">
        {card.hasContact ? (
          <a className="btn btn-wa btn-sm" href={`/connect/${card.pageId}?via=whatsapp${card.officeId ? `&office=${card.officeId}` : ""}`} rel="nofollow">
            <Icon name="whatsapp" size="sm" />{t("connect")}
          </a>
        ) : null}
        {card.kind !== "office" ? <CompareToggle pageId={card.pageId} initial={compare.includes(card.pageId)} label={t("compare.tick")} fullMessage={t("compare.full")} /> : null}
        <span className="push">
          <BookmarkButton pageId={card.pageId} initial={bookmarks.includes(card.pageId)} label={t("bookmark")} />
        </span>
      </div>
    </article>
  );
}
