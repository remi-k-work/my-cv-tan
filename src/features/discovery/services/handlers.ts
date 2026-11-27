// services, features, and other libraries
import { documentRoute } from "@/lib/server-route";
import { Robots } from "./robots";
import { Sitemap } from "./sitemap";
import { Discovery } from "./llms";

export const robotsHandler = documentRoute(() => Robots.use((robots) => robots.document));
export const sitemapHandler = documentRoute(() => Sitemap.use((sitemap) => sitemap.document));

// Discovery indexes are language-independent and never carry visitor cookies
export const llmsTxtHandler = documentRoute((request) => Discovery.use((discovery) => discovery.siteIndex(request)));
export const llmsFullTxtHandler = documentRoute((request) => Discovery.use((discovery) => discovery.siteIndexFull(request)));
