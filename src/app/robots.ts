import type { MetadataRoute } from "next";
import { config } from "@/lib/config";

/** Main site robots.txt (rules/seo.md section 6). Custom domains serve their own from /sites/{host}/robots.txt. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/admin/", "/account/", "/manage/", "/compare", "/search", "/ml/search", "/ml/compare", "/connect/", "/login", "/*?*=*"],
      },
    ],
    sitemap: `${config.siteOrigin}/sitemap.xml`,
  };
}
