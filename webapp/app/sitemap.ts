import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";
import { getAllSlugsForSitemap } from "@/lib/queries";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { profiles, cities, institutions, posts, cityCategoryPairs } = await getAllSlugsForSitemap();

  const entries: MetadataRoute.Sitemap = [
    { url: siteUrl, changeFrequency: "weekly", priority: 1 },
    { url: `${siteUrl}/near-me`, changeFrequency: "monthly", priority: 0.5 },
  ];

  for (const city of cities) {
    entries.push({ url: `${siteUrl}/city/${city.slug}`, changeFrequency: "weekly", priority: 0.8 });
  }
  for (const pair of cityCategoryPairs) {
    entries.push({ url: `${siteUrl}/city/${pair}`, changeFrequency: "weekly", priority: 0.9 });
  }
  for (const profile of profiles) {
    entries.push({
      url: `${siteUrl}/${profile.slug}`,
      lastModified: profile.updatedAt,
      changeFrequency: "weekly",
      priority: 0.9,
    });
  }
  for (const institution of institutions) {
    entries.push({ url: `${siteUrl}/institution/${institution.slug}`, changeFrequency: "monthly", priority: 0.6 });
  }
  for (const post of posts) {
    entries.push({
      url: `${siteUrl}/${post.profile.slug}/posts/${post.slug}`,
      lastModified: post.publishedAt,
      changeFrequency: "monthly",
      priority: 0.5,
    });
  }

  return entries;
}
