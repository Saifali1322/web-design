import type { MetadataRoute } from "next";

const BASE = "https://juicecartel.uk";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: BASE, lastModified: now, priority: 1 },
    { url: `${BASE}/menu`, lastModified: now, priority: 0.9 },
    { url: `${BASE}/subscribe`, lastModified: now, priority: 0.9 },
    { url: `${BASE}/delivery`, lastModified: now, priority: 0.6 },
    { url: `${BASE}/allergens`, lastModified: now, priority: 0.5 },
  ];
}
