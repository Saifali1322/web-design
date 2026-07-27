import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Nothing useful for a crawler here, and it keeps checkout noise out.
      disallow: ["/api/", "/order/"],
    },
    sitemap: "https://juicecartel.uk/sitemap.xml",
  };
}
