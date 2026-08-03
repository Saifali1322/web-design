import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    /**
     * The product photography is 1024px PNGs at roughly 1.6MB each — fine as
     * masters, ruinous as what a phone downloads. Next re-encodes on demand
     * and caches the result, and AVIF is worth about another 25-30% over
     * WebP on these images: they are large flat dark fields with a few
     * saturated subjects, which is exactly what AVIF is good at.
     *
     * AVIF is listed first because the browser takes the first format it
     * accepts. The cost is a slower *first* request per size per deploy while
     * the encode happens; every request after that is served from the image
     * cache, so the trade is one cold miss against every subsequent visitor
     * downloading a third less.
     */
    formats: ["image/avif", "image/webp"],
  },
};

export default nextConfig;
