import type { MetadataRoute } from "next";

// Served at /manifest.webmanifest. Makes warm sitter installable as a PWA.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "warm sitter — Trusted babysitters",
    short_name: "warm sitter",
    description:
      "Find and book caring, background-checked babysitters. Free to search — pay only when you connect.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f0f9ff",
    theme_color: "#0ea5e9",
    lang: "ko",
    categories: ["lifestyle", "social"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
