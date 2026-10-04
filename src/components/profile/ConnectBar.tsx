import { Icon } from "@/components/Icon";
import type { TFunction } from "@/lib/i18n";

/** Sticky bottom bar on phones (profile, firm and office pages). The only main action is Connect (WhatsApp); there is no hire or book button. */
export function ConnectBar({ pageId, officeId, t, brand = false }: { pageId: number; officeId?: number | null; t: TFunction; brand?: boolean }) {
  const q = officeId ? `&office=${officeId}` : "";
  return (
    <div className="connect-bar" role="region" aria-label={t("connect")}>
      <a className={`btn ${brand ? "btn-brand" : "btn-wa"} btn-block`} href={`/connect/${pageId}?via=whatsapp${q}`} rel="nofollow"><Icon name="whatsapp" size="sm" />{t("connect")}</a>
      <a className="btn btn-outline" href={`/connect/${pageId}?via=call${q}`} rel="nofollow"><Icon name="phone" size="sm" />{t("connect.call")}</a>
    </div>
  );
}

export function ConnectButtons({ pageId, officeId, t, brand = false, ghost = false }: { pageId: number; officeId?: number | null; t: TFunction; brand?: boolean; ghost?: boolean }) {
  const q = officeId ? `&office=${officeId}` : "";
  return (
    <>
      <a className={`btn ${brand ? "btn-brand" : "btn-wa"}`} href={`/connect/${pageId}?via=whatsapp${q}`} rel="nofollow"><Icon name="whatsapp" size="sm" />{t("connect")}</a>
      <a className={`btn ${ghost ? "btn-outline" : "btn-outline"} hide-sm`} href={`/connect/${pageId}?via=call${q}`} rel="nofollow"><Icon name="phone" size="sm" />{t("connect.call")}</a>
    </>
  );
}
