import type { Metadata } from "next";
import { absolute, withLang } from "./url";
import type { Lang } from "./i18n";
import { metaDescription, stripHtml, truncate } from "./text";

/* ------------------------------------------------------------ metadata */

export interface MetaInput {
  title: string;
  description?: string | null;
  /** Absolute canonical URL, or a site path (made absolute). */
  canonical: string;
  noindex?: boolean;
  image?: string | null;
  type?: "website" | "profile" | "article";
  /** Path (without /ml prefix) for hreflang alternates; omit when the page has no Malayalam variant. */
  hreflangPath?: string;
  lang?: Lang;
  /** Use on custom domains (their own origin for alternates is not emitted). */
  skipAlternates?: boolean;
}

const toAbs = (u: string) => (/^https?:\/\//.test(u) ? u : absolute(u));

export function buildMetadata(m: MetaInput): Metadata {
  const description = metaDescription(m.description);
  const canonical = toAbs(m.canonical);
  const alternates: Metadata["alternates"] = { canonical };
  if (m.hreflangPath && !m.skipAlternates) {
    alternates.languages = {
      en: absolute(withLang(m.hreflangPath, "en")),
      ml: absolute(withLang(m.hreflangPath, "ml")),
      "x-default": absolute(withLang(m.hreflangPath, "en")),
    };
  }
  return {
    title: m.title,
    description: description || undefined,
    robots: m.noindex ? { index: false, follow: false } : { index: true, follow: true },
    alternates,
    openGraph: {
      title: m.title,
      description: description || undefined,
      url: canonical,
      type: m.type === "article" ? "article" : m.type === "profile" ? "profile" : "website",
      images: m.image ? [{ url: toAbs(m.image) }] : undefined,
      locale: m.lang === "ml" ? "ml_IN" : "en_IN",
    },
    twitter: {
      card: m.image ? "summary_large_image" : "summary",
      title: m.title,
      description: description || undefined,
      images: m.image ? [toAbs(m.image)] : undefined,
    },
  };
}

/* ------------------------------------------------------------- JSON-LD */

type Json = Record<string, unknown>;

/** Remove null/undefined/empty-array fields so the markup stays valid. */
export function clean<T>(value: T): T {
  if (Array.isArray(value)) return value.map(clean).filter((v) => v !== undefined) as unknown as T;
  if (value && typeof value === "object") {
    const out: Json = {};
    for (const [k, v] of Object.entries(value as Json)) {
      if (v === null || v === undefined || v === "") continue;
      if (Array.isArray(v) && v.length === 0) continue;
      out[k] = clean(v);
    }
    return out as T;
  }
  return value;
}

export interface JsonLdOffice {
  address?: string | null;
  locality?: string | null;
  pincode?: string | null;
  lat?: number | null;
  lng?: number | null;
  phone?: string | null;
}

const postalAddress = (o: JsonLdOffice | undefined, district?: string | null) =>
  o || district
    ? clean({
        "@type": "PostalAddress",
        streetAddress: o?.address,
        addressLocality: o?.locality ?? district,
        postalCode: o?.pincode,
        addressCountry: "IN",
      })
    : undefined;

export function attorneyJsonLd(p: {
  name: string;
  url: string;
  image?: string | null;
  bio?: string | null;
  mainOffice?: JsonLdOffice;
  district?: string | null;
  areas: string[];
}): Json {
  return clean({
    "@context": "https://schema.org",
    "@type": "Attorney",
    name: p.name,
    url: p.url,
    image: p.image,
    description: p.bio ? truncate(stripHtml(p.bio), 160) : undefined,
    address: postalAddress(p.mainOffice, p.district),
    areaServed: p.district ? { "@type": "AdministrativeArea", name: p.district } : undefined,
    knowsAbout: p.areas,
    // No aggregateRating, review or priceRange (Rule 36; counsel review pending).
  });
}

export function legalServiceJsonLd(p: {
  name: string;
  url: string;
  image?: string | null;
  bio?: string | null;
  mainOffice?: JsonLdOffice;
  district?: string | null;
  areas: string[];
  employees: { name: string; title?: string | null; image?: string | null }[];
}): Json {
  return clean({
    "@context": "https://schema.org",
    "@type": "LegalService",
    name: p.name,
    url: p.url,
    image: p.image,
    description: p.bio ? truncate(stripHtml(p.bio), 160) : undefined,
    address: postalAddress(p.mainOffice, p.district),
    knowsAbout: p.areas,
    hasOfferCatalog: p.areas.length
      ? {
          "@type": "OfferCatalog",
          name: "Legal services",
          itemListElement: p.areas.map((a) => ({ "@type": "Offer", itemOffered: { "@type": "Service", name: a } })),
        }
      : undefined,
    employee: p.employees.slice(0, 5).map((e) => ({ "@type": "Person", name: e.name, jobTitle: e.title, image: e.image })),
  });
}

export function officeJsonLd(p: {
  officeName: string;
  pageName: string;
  url: string;
  pageUrl: string;
  image?: string | null;
  about?: string | null;
  office: JsonLdOffice;
  areas: string[];
}): Json {
  return clean({
    "@context": "https://schema.org",
    "@type": "LegalService",
    name: `${p.officeName} - ${p.pageName}`,
    url: p.url,
    image: p.image,
    description: p.about,
    address: postalAddress(p.office),
    geo:
      p.office.lat != null && p.office.lng != null
        ? { "@type": "GeoCoordinates", latitude: p.office.lat, longitude: p.office.lng }
        : undefined,
    telephone: p.office.phone,
    knowsAbout: p.areas,
    parentOrganization: { "@type": "LegalService", name: p.pageName, url: p.pageUrl },
  });
}

export function articleJsonLd(p: {
  headline: string;
  body: string;
  image?: string | null;
  published: Date;
  modified: Date;
  author?: { name: string; url: string } | null;
  categories?: string[];
  language: string;
  court?: { name: string; url?: string } | null;
  courtUpdate?: boolean;
  url: string;
}): Json {
  return clean({
    "@context": "https://schema.org",
    "@type": "Article",
    headline: p.headline,
    description: truncate(stripHtml(p.body), 160),
    image: p.image,
    datePublished: p.published.toISOString(),
    dateModified: p.modified.toISOString(),
    author: p.author
      ? { "@type": "Person", name: p.author.name, url: p.author.url }
      : { "@type": "Organization", name: "AdvocateID" },
    articleBody: stripHtml(p.body),
    articleSection: p.categories?.[0],
    keywords: p.categories?.length ? p.categories.join(", ") : undefined,
    inLanguage: p.language,
    mainEntityOfPage: p.url,
    about:
      p.courtUpdate && p.court
        ? { "@type": "GovernmentOrganization", name: p.court.name, url: p.court.url }
        : undefined,
    mentions: !p.courtUpdate && p.court ? { "@type": "Thing", name: p.court.name } : undefined,
  });
}

export function courtJsonLd(p: {
  name: string;
  url: string;
  address?: string | null;
  locality?: string | null;
  district?: string | null;
  pincode?: string | null;
  lat?: number | null;
  lng?: number | null;
  phone?: string | null;
  website?: string | null;
}): Json {
  return clean({
    "@context": "https://schema.org",
    "@type": "GovernmentOrganization",
    name: p.name,
    url: p.url,
    description: [p.address, p.locality ? `Jurisdiction: ${[p.locality, p.district].filter(Boolean).join(", ")}.` : null]
      .filter(Boolean)
      .join(" "),
    address: clean({
      "@type": "PostalAddress",
      streetAddress: p.address,
      addressLocality: p.locality,
      postalCode: p.pincode,
      addressCountry: "IN",
    }),
    geo: p.lat != null && p.lng != null ? { "@type": "GeoCoordinates", latitude: p.lat, longitude: p.lng } : undefined,
    contactPoint: p.phone ? { "@type": "ContactPoint", contactType: "Main Office", telephone: p.phone } : undefined,
    sameAs: p.website ? [p.website] : undefined,
    hasMap:
      p.lat != null && p.lng != null ? `https://www.google.com/maps?q=${p.lat},${p.lng}` : undefined,
  });
}

export function breadcrumbJsonLd(items: { name: string; url: string }[]): Json {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, item: toAbs(it.url) })),
  };
}

/** Serialise for a <script type="application/ld+json"> block (escapes "<" so it cannot close the tag). */
export function jsonLdString(data: Json | Json[]): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

/* -------------------------------------------------- search indexability */

export interface SearchIndexInput {
  /** True when the URL is a clean readable path page (no query filters). */
  cleanPath: boolean;
  hasFilterParams: boolean;
  pageNumber: number;
  resultCount: number;
  hasCourtUpdates: boolean;
}

export const MAX_INDEXED_PAGE = 5;
export const MIN_ADVOCATES_FOR_INDEX = 3;

/** Search pages: indexable only as clean readable paths and not thin. */
export function searchIndexable(i: SearchIndexInput): boolean {
  if (!i.cleanPath || i.hasFilterParams) return false;
  if (i.pageNumber > MAX_INDEXED_PAGE) return false;
  return i.resultCount >= MIN_ADVOCATES_FOR_INDEX || i.hasCourtUpdates;
}

