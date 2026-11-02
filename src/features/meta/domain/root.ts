// services, features, and other libraries
import { Array } from "effect";
import { authorLink, llmsAlternateLinks, llmsDiscoveryLink, sitemapLink } from "./links";

// constants
import { AUTHOR_URL, AVATAR, BRANDED_TITLE, HOME_TITLE, NOINDEX_FOLLOW, SITE_DESCRIPTION, SITE_NAME, SOCIAL_LINKS } from "./constants";

// types
import type { LinkTag, MetaTag } from "./models";

// --- The site-wide head ---
// TanStack merges the root array with every leaf's: `meta` dedupes by name/property keeping the leaf
// value, but `links` dedupes only when byte-identical. A root-level canonical or a root-level
// Markdown twin alternate would therefore render beside every page's own and hand crawlers two
// conflicting documents for one URL. Page-level links belong solely to the page head.
//
// No `scripts` either, and the contract below types that as an error: TanStack concatenates the
// scripts of every match in the chain, so a root-level graph would render beside a page's own and
// leave a crawler two blocks to reconcile (see pageHead in heads.ts).
//
// `meta` and `links` are named by the shared MetaTag/LinkTag unions rather than widened to
// `Record<string, unknown>`: TanStack's own MetaDescriptor ends in that catch-all, so a widened
// contract would accept an entry with neither `name` nor `property` — a misspelled tag the router
// then drops silently at render time.
interface RootHeadContract {
  readonly meta: ReadonlyArray<MetaTag>;
  readonly links: ReadonlyArray<LinkTag>;
  // Present only so it can be forbidden: declaring a script here is a compile error
  readonly scripts?: undefined;
}

// Each social profile also gets its own <link rel="me"> entry so verifiers can confirm the identity
const ME_LINKS = Array.map(SOCIAL_LINKS, (href) => ({ rel: "me", href }));

export const ROOT_HEAD = {
  meta: [
    { charSet: "utf-8" },
    { name: "viewport", content: "width=device-width, initial-scale=1" },
    { name: "theme-color", content: "#1d2549" },
    { title: BRANDED_TITLE(HOME_TITLE) },
    { name: "description", content: SITE_DESCRIPTION },

    { name: "author", content: SITE_NAME },
    // Safe default: pages with complete data opt back into indexing (see pageHead in heads.ts)
    { name: "robots", content: NOINDEX_FOLLOW },
    // No OpenGraph/Twitter tags, deliberately. TanStack dedupes `meta` by name/property keeping
    // the LEAF value, so on a real page these would always lose anyway — they would only survive on
    // the head that an unmatched URL falls back to this one. Publishing `og:url` pointing at the
    // homepage from `/no-such-page` hands every scraper that lands there a canonical conflict it
    // has to reconcile, and a 404 is not a document anyone should be sharing a card for.
  ],
  links: [
    { rel: "icon", href: "/icon.svg", type: "image/svg+xml" },
    // iOS "Add to Home Screen" and high-DPI search previews use the touch icon, not the SVG favicon
    { rel: "apple-touch-icon", href: AVATAR.src },
    // Author attribution as a followable link: parsers that read rel="author" but not OpenGraph
    // still get the author's profile URL.
    authorLink(AUTHOR_URL),
    // llms.txt auto-discovery: AI crawlers can find the index from HTTP headers alone.
    llmsDiscoveryLink(),
    // The sitemap is advertised in-document as well as from robots.txt, so a crawler landing on a
    // page gets the URL list without a second hop and the two listings can never disagree
    sitemapLink(),
    // Identity links: rel="me" lets profile-based verifiers (Mastodon, IndieWeb) confirm the person
    ...ME_LINKS,
    // The AI discovery documents are site-wide and identical on every page, so they safely live
    // here; llms-full.txt is advertised directly to shorten the HTML -> index -> content chain
    ...llmsAlternateLinks,
  ],
  // No `scripts` key: see RootHeadContract above, which makes declaring one a compile error
} satisfies RootHeadContract;
