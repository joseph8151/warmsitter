import type { MetadataRoute } from "next";

// Public, crawlable pages. (Dynamic sitter profiles are intentionally omitted to
// avoid a DB dependency at build; add them via an async query if desired.)
export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const routes = ["", "/sitters", "/jobs", "/pricing", "/login"];
  return routes.map((path) => ({
    url: `${base}${path}`,
    changeFrequency: "daily",
    priority: path === "" ? 1 : 0.7,
  }));
}
