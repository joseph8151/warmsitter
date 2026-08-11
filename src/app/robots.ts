import type { MetadataRoute } from "next";

// Allow crawling of public marketing pages; keep authenticated/admin/API private.
export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/admin",
          "/dashboard",
          "/chat",
          "/bookings",
          "/interviews",
          "/earnings",
          "/profile",
          "/receipts",
          "/favorites",
        ],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
