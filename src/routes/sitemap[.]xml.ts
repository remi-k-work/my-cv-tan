// tanstack
import { createFileRoute } from "@tanstack/react-router";

// services, features, and other libraries
import { sitemapHandler } from "@/features/meta/services/handlers";

export const Route = createFileRoute("/sitemap.xml")({ server: { handlers: { GET: sitemapHandler } } });
