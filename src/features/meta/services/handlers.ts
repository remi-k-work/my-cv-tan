// services, features, and other libraries
import { documentRoute } from "@/lib/server-route";
import { Robots } from "./robots";
import { Sitemap } from "./sitemap";

export const robotsHandler = documentRoute(() => Robots.use((robots) => robots.document));
export const sitemapHandler = documentRoute(() => Sitemap.use((sitemap) => sitemap.document));
