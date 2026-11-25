// services, features, and other libraries
import { Effect } from "effect";
import { documentRoute } from "@/lib/server-route";
import { Sitemap } from "./sitemap";
import { txtResponse } from "./responses";

// constants
import { ROBOTS_TXT } from "@/features/meta/domain/robots";
import { ROBOTS_TXT_INDEX } from "@/features/meta/domain/discovery";

export const robotsHandler = documentRoute(() => Effect.sync(() => txtResponse(ROBOTS_TXT, ROBOTS_TXT_INDEX.url)));
export const sitemapHandler = documentRoute(() => Sitemap.use((sitemap) => sitemap.document));
