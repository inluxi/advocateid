import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "AdvocateID",
    short_name: "AdvocateID",
    description: "Directory of advocates and law firms in India",
    start_url: "/",
    display: "standalone",
    background_color: "#F6F1E7",
    theme_color: "#16213E",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
