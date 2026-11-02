// --- <link> tags and RFC 8288 Link-header values ---
// One declaration, two projections: the same link a crawler reads out of an HTML <head> is the one
// it reads out of a Link response header, so both are derived from `AI_INDEX_LINKS` instead of
// being spelled twice. A third surface — the twins' "Pages" section — reads the same records again.
//
// The AI index URL declarations (formerly geo.ts) live here because they are link values, not page
// copy: every surface that advertises an index reads it from this module.

// services, features, and other libraries
import { Array, Option, pipe } from "effect";

// types
import type { PreferredLanguage } from "@/domain/models";
import type { LinkTag } from "./models";

// constants
import { DEFAULT_LANGUAGE, SITE_LANGUAGES, SITEMAP_HREF } from "./constants";
import { absoluteUrl, markdownTwinUrl, withLanguageParam } from "./url";

// --- The three RFC 8288 link parameters this site publishes.
//
// A closed set rather than an open index signature, mirroring the MetaTag rationale in models.ts: a
// misspelled parameter is a compile error here instead of a header parameter that is silently
// dropped — and a dropped `hreflang` is a language variant no crawler can resolve.
interface LinkParameters {
  readonly type?: string;
  readonly title?: string;
  readonly hreflang?: string;
}

// A link before projection. The parameter set is closed, so the serializer can walk a fixed key
// order instead of whatever order the builder happened to write its object literal in.
export interface LinkValue extends LinkParameters {
  readonly href: string;
  readonly rel: string;
}

// Parameters serialize in this order whether or not the declaring literal listed them in it: RFC
// 9309's predecessor treats link parameters as an unordered set, so the only thing a fixed order
// buys is that two responses advertising the same links are byte-equal.
const LINK_PARAMETER_ORDER: ReadonlyArray<keyof LinkParameters> = ["type", "title", "hreflang"];

// The one RFC 8288 serializer. `href` is the URI-reference rather than a parameter, so destructuring
// it out leaves exactly the parameters, and a parameter a builder left out is absent from the header
// rather than serialized as `name="undefined"`.
//
// `getSomes` rather than `filterMap`: that one takes a Result-returning filter, so an Option-producing
// one would silently drop every parameter instead of the absent ones.
const linkHeader = ({ href, rel, ...parameters }: LinkValue) => {
  const declared = pipe(
    LINK_PARAMETER_ORDER,
    Array.map((name) => Option.map(Option.fromNullishOr(parameters[name]), (value) => `${name}="${value}"`)),
    Array.getSomes
  );

  return `<${href}>; ${Array.join([`rel="${rel}"`, ...declared], "; ")}`;
};

export const joinLinkHeader = (links: ReadonlyArray<LinkValue>) => pipe(links, Array.map(linkHeader), Array.join(", "));

// Canonical <link> from an already-resolved absolute URL, so stray query parameters must never
// become duplicate documents
export const canonicalLink = (href: string): LinkTag => ({ rel: "canonical", href });

// Machine-readable alternate: points crawlers and AI fetchers at the Markdown twin, pinned with
// ?lang= so the advertised twin is the document the page itself represents. The pin is the same
// helper every other twin URL resolves through, so the head advertisement and the twin's own
// Content-Location byte-match.
export const markdownAlternateLink = (mdPath: string, preferredLanguage: PreferredLanguage): LinkTag => ({
  rel: "alternate",
  type: "text/markdown",
  href: markdownTwinUrl(mdPath, preferredLanguage),
});

// Advertised from the document itself as well as from robots.txt, so a crawler landing on a page
// finds the URL list without a second hop and the two listings can never disagree
export const sitemapLink = (): LinkTag => ({ rel: "sitemap", href: absoluteUrl(SITEMAP_HREF) });

// Author attribution link: a followable profile URL for parsers and verifiers that read
// rel="author" but not OpenGraph. Published on article-like pages only.
export const authorLink = (href: string): LinkTag => ({ rel: "author", href });

// llms.txt auto-discovery link: the emerging standard (https://llmstxt.com) lets AI crawlers find
// the index from HTTP headers alone. Published site-wide so an unmatched route still advertises it.
export const llmsDiscoveryLink = (): LinkTag => ({ rel: "llms", href: absoluteUrl("/llms.txt") });

// --- The machine-readable discovery surface (GEO) ---
// Every URL a crawler or AI fetcher can land on that is neither an HTML page nor a Markdown twin.
// This module is the only place one is named, and the only place one is formatted as a Markdown
// link: the HTML <head> advertisements, the Link response headers, the twins' own "Pages" section
// and the two llms.txt "Discovery" sections all read it.

// The two AI indexes, each declared once with both spellings of its identity: the `name` is the
// link title every surface prints, and `url` is the absolute document. Keeping them as named
// constants lets a single consumer — the twins' dead-end escape line — name the index it points at
// without positional indexing into a list.
export const LLMS_TXT_INDEX = { name: "llms.txt", url: absoluteUrl("/llms.txt") } as const;
export const LLMS_FULL_TXT_INDEX = { name: "llms-full.txt", url: absoluteUrl("/llms-full.txt") } as const;

// The two indexes in the order a fetcher should walk them: the index it is already reading, then
// the single-request companion. Absolute forms, resolved once at module scope: these are static
// site facts, not per-render values.
export const AI_INDEX_URLS = [LLMS_TXT_INDEX, LLMS_FULL_TXT_INDEX] as const;

// The two indexes as Markdown links — the shape every Markdown surface that advertises them prints,
// from the twins' "Pages" section to both llms.txt "Discovery" lists. Resolved once beside the URLs
// above rather than re-formatted inline in the twin document graph, so no surface can print a
// spelling the URL declaration does not carry.
export const AI_INDEX_MARKDOWN_LINKS: ReadonlyArray<string> = Array.map(AI_INDEX_URLS, ({ name, url }) => `[${name}](${url})`);

// The llms.txt Discovery section, in the order a fetcher should walk it: the index it is already
// reading, the single-request companion, then the two crawl directives. Rendered as markdown links
// rather than `Label: URL` prose, because the llms.txt convention is a list of `[title](url)` items
// and a parser reads one list rule instead of extracting a URL from a sentence.
export const DISCOVERY_LINES: ReadonlyArray<string> = Array.map(
  [
    { name: LLMS_TXT_INDEX.name, summary: "this index", href: "/llms.txt" },
    { name: LLMS_FULL_TXT_INDEX.name, summary: "the complete site in one document", href: "/llms-full.txt" },
    { name: "robots.txt", summary: "crawl directives", href: "/robots.txt" },
    { name: "sitemap.xml", summary: "sitemap", href: "/sitemap.xml" },
  ] as const,
  ({ name, summary, href }) => `[${name}](${absoluteUrl(href)}): ${summary}.`
);

// Every link list the HTML heads also publish, in HTTP form. Declared once off the machine-readable
// discovery surface: the <head> advertisements, the Link response headers, the twins' own "Pages"
// section and the llms.txt "Discovery" sections all read these four facts from here.
export const AI_INDEX_LINKS: ReadonlyArray<LinkValue> = Array.map(AI_INDEX_URLS, ({ name, url }) => ({
  rel: "alternate",
  type: "text/plain",
  title: name,
  href: url,
}));

// The <head> projection of the same records, as LinkTag rather than LinkValue: a <head> entry has no
// hreflang slot to fill, and the AI indexes publish none, so the projection names exactly the four
// attributes a tag carries.
export const llmsAlternateLinks: ReadonlyArray<LinkTag> = Array.map(AI_INDEX_LINKS, ({ href, rel, type, title }) => ({ rel, href, type, title }));

// The pair as one ready-to-set header, so every surface advertising *only* the indexes — the HTML
// and sitemap responses, and a twin's 404 fallback — sets the same string with the same ordering.
// A twin's success header interleaves the indexes with its canonical and language variants, so it
// still builds its own list rather than reading this constant.
export const AI_INDEX_LINK_HEADER = joinLinkHeader(AI_INDEX_LINKS);

// Every supported language variant of one document as hreflang alternates, plus the x-default.
// Emitted from the twins, whose URLs are per-language; the HTML pages negotiate from one URL, so
// they carry no hreflang.
export const languageVariantLinks = (markdownUrl: string): ReadonlyArray<LinkValue> => [
  ...Array.map(SITE_LANGUAGES, (language): LinkValue => ({ rel: "alternate", type: "text/markdown", hreflang: language, href: withLanguageParam(markdownUrl, language) })),
  { rel: "alternate", type: "text/markdown", hreflang: "x-default", href: withLanguageParam(markdownUrl, DEFAULT_LANGUAGE) },
];
