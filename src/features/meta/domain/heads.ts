// --- The shared page head ---
//
// Pure by design: heads are rendered synchronously in route `head()` functions, so the builders
// stay Effect-free. Effect data types (`Option`) are used where a value may be absent.
//
// TanStack concatenates the scripts of every match in the chain instead of replacing them, so the
// site entities are merged here rather than declared at root scope: a crawler then reads one
// document in one parse pass, with the page's own focus stated first.

// services, features, and other libraries
import { Option } from "effect";
import { experienceHeadline, excerpt } from "@/features/experience/domain/helpers";
import { authorLink, canonicalLink, llmsDiscoveryLink, markdownAlternateLink } from "./links";
import { absoluteUrl, experienceMarkdownPath, experiencePath, experienceScreenshot } from "./url";
import { socialMeta } from "./social";
import { jsonLdGraph } from "./json-ld/core";
import { siteNodes } from "./json-ld/site";
import { contactJsonLd } from "./json-ld/contact";
import { educationJsonLd } from "./json-ld/education";
import { experienceJsonLd } from "./json-ld/experience";
import { homeJsonLd } from "./json-ld/home";
import { staticPageCopy, CONTACT_PATH, EDUCATION_PATH, HOME_PATH } from "./static-pages";

// types
import { headLanguage } from "./language";
import type { MatchChain } from "./language";
import type { SocialImage, SocialMetaInput } from "./social";
import type { EducationList } from "@/features/education/domain/models";
import type { ExperienceList } from "@/features/experience/domain/models";
import type { LocalizedCopy, StaticPageCopy } from "./static-pages";
import type { PagePath, PreferredLanguage } from "@/domain/models";
import type { JsonLdNodes } from "./json-ld/core";
import type { ExperienceHeadInput, PageHead, StaticPageHeadInput } from "./models";
import { emptyHead } from "./models";

// constants
import { AUTHOR_URL, BRANDED_TITLE, GLOBAL_SOCIAL_IMAGE, INDEXABLE_ROBOTS, META_DESCRIPTION_LENGTH, NOINDEX_FOLLOW, SITE_DESCRIPTION, TWITTER_HANDLE } from "./constants";

// --- The shared page head ---
// Complete data opts into indexing, so one shared block keeps the title, robots directive, social
// tags, canonical and Markdown twin consistent; incomplete loader responses inherit the root
// noindex policy instead.
//
// `pageHead` is pure by design: route `head()` functions render synchronously, so builders stay
// Effect-free. Effect data types (`Option`) are used only where a value may be absent.
const pageHead = ({ markdownPath, graph, authorLink: authorLinkValue, ...social }: PageHeadSpec): PageHead => {
  // The <title> carries the site prefix; og:title carries the bare headline. The two spellings live
  // side by side so search results and social cards each get the wording they expect.
  const meta = [
    { title: BRANDED_TITLE(social.title) },
    { name: "description", content: social.description },
    // Complete pages invite indexing; the root falls back to noindex for partial or 404 shells.
    { name: "robots", content: INDEXABLE_ROBOTS },
    // OpenGraph / Twitter / article classification: every social fact flows from one canonical URL.
    ...socialMeta(social),
  ];

  // The canonical <link> and the language-pinned Markdown twin alternate. Both derive from the same
  // absolute URL so crawlers never see two spellings of one document.
  const links = [canonicalLink(social.canonical), markdownAlternateLink(markdownPath, social.preferredLanguage)];

  // Author attribution as a followable link: parsers and verifiers that read rel="author" but not
  // OpenGraph still get the author's profile URL. Only article-like pages publish it.
  const author = authorLinkValue ? [authorLink(authorLinkValue)] : [];

  // llms.txt auto-discovery link: the emerging standard (https://llmstxt.com) lets AI crawlers find
  // the index from HTTP headers alone. Every page publishes it so an unmatched route still advertises it.
  const discovery = [llmsDiscoveryLink()];

  // Exactly one script per page: `@graph` keeps every @id cross-reference resolvable in one pass.
  // Site entities are prepended so a parser merges them with the page's own nodes in one pass.
  const scripts = [jsonLdGraph([...siteNodes, ...graph])];

  return { meta, links: [...links, ...author, ...discovery], scripts };
};

// --- Minimal fallback head for missing loader data ---
// When a route's loader fails, TanStack still merges the root head, but page-specific social
// tags, canonical, and JSON-LD are lost. This fallback keeps the page addressable (canonical +
// robot noindex) and carries the site entities so a crawler still reads one coherent graph.
// It deliberately omits OpenGraph/Twitter cards: those need real copy, not a placeholder.
const fallbackHead = (pagePath: string, preferredLanguage: PreferredLanguage): PageHead => {
  const canonical = absoluteUrl(pagePath);
  return {
    meta: [
      // No authored title is available; the root head supplies the branded <title>. Keep only the
      // indexing directive so a failed shell never becomes a search result.
      { name: "robots", content: NOINDEX_FOLLOW },
      { name: "description", content: SITE_DESCRIPTION },
    ],
    links: [canonicalLink(canonical)],
    // Site entities only — no page-level node, so the graph stays coherent without fabricated data.
    scripts: [jsonLdGraph([...siteNodes])],
  };
};

// --- Route head wrapper ---
//
// Every route head repeats the same three steps: bail on missing loader data, resolve the
// language from the root match, then call a page-specific builder. This wrapper holds that
// repetition in one place so a new route cannot forget the language resolution.
//
// Generic over the loader data type so TypeScript keeps the payload typed inside the build
// closure. Returns `PageHead | {}`: `{}` means "contribute nothing" — TanStack then merges only
// the root head, so the noindex default applies and no fabricated social tags leak onto a partial
// shell.
//
// `headLanguage(matches)` resolves once and is shared by both branches — the fallback path and
// the success path both render in the negotiated language, so resolving twice was redundant work.
//
// Effect-free by design: route `head()` functions render synchronously, so the builders stay
// pure. `Option` is used to turn the "is there loader data?" question into data instead of a
// boolean branch — per the Effect AGENTS.md guidance to keep control flow as data.
export const routeHead = <TData>(
  loaderData: TData,
  matches: MatchChain,
  build: (loaderData: NonNullable<TData>, preferredLanguage: PreferredLanguage) => PageHead,
  options: { readonly fallbackPath?: string } = {}
): PageHead | {} => {
  // Resolve the negotiated language once at the top, shared by both branches. Resolving it inside
  // each branch re-decodes the root loader payload for no benefit.
  const preferredLanguage = headLanguage(matches);

  // Turn the possibly-absent loader payload into an Option so presence/absence is data, not a
  // boolean branch. `fromNullishOr` treats null and undefined identically: both mean "no loader
  // data resolved yet".
  return Option.match(Option.fromNullishOr(loaderData), {
    onNone: () =>
      options.fallbackPath !== undefined
        ? fallbackHead(options.fallbackPath, preferredLanguage)
        : emptyHead,
    onSome: (data) => build(data, preferredLanguage),
  });
};

// --- The three static pages ---
// They share localized visible copy, an authored search summary, canonical links and JSON-LD. The
// Markdown twins read the same resolution through staticPageCopy, so the HTML and .md documents
// cannot drift apart.

// The three static pages share the copy-resolution + page-head shape; only the JSON-LD graph
// builder differs. Extracting it here keeps home/education/contact from each re-spelling the
// same six fields.
const staticPageHead = (
  input: StaticPageHeadInput,
  pagePath: PagePath,
  graph: (copy: StaticPageCopy) => JsonLdNodes
): PageHead => {
  const copy = staticPageCopy(input.pageTitles, pagePath, input.preferredLanguage);
  return pageHead({
    title: copy.seoTitle,
    description: copy.description,
    canonical: copy.canonical,
    markdownPath: copy.mdHref,
    image: GLOBAL_SOCIAL_IMAGE,
    preferredLanguage: copy.preferredLanguage,
    graph: graph(copy),
  });
};

// Resolves copy once, then builds the head and graph from the same resolved values so the meta
// tags and structured data can never describe different documents.
export const homeHead = (input: StaticPageHeadInput & { readonly experienceList: ExperienceList }): PageHead =>
  staticPageHead(input, HOME_PATH, (copy) => homeJsonLd({ ...copy, experienceList: input.experienceList }));

export const educationHead = (input: StaticPageHeadInput & { readonly educationList: EducationList }): PageHead =>
  staticPageHead(input, EDUCATION_PATH, (copy) => educationJsonLd({ ...copy, educationList: input.educationList }));

export const contactHead = (input: StaticPageHeadInput): PageHead =>
  staticPageHead(input, CONTACT_PATH, (copy) => contactJsonLd(copy));

// --- The detail page ---
// Always canonicalizes to the clean /{slug} URL derived from experience.slug, so stray query
// parameters never become duplicate documents
export const experienceHead = ({ experience, preferredLanguage }: ExperienceHeadInput): PageHead => {
  const { slug, txt, imageName, type } = experience;

  // Disambiguates employment roles from creative projects for the article:section signal
  const employment = type === "e";
  const headline = experienceHeadline(experience, preferredLanguage);

  return pageHead({
    title: headline,
    description: excerpt(txt, META_DESCRIPTION_LENGTH),
    canonical: absoluteUrl(experiencePath(slug)),
    markdownPath: experienceMarkdownPath(slug),
    image: experienceCardImage(headline, imageName),
    // `twitterImage` is deliberately unset: X's cards reject WebP, so socialMeta falls back to the
    // jpeg banner it already defaults to rather than each call site re-naming it.
    //
    // A detail page is a document *about one subject*, which is what makes it article-like: it
    // earns the article card and its author attribution rather than sharing the generic website
    // type the three list pages publish.
    ogType: "article",
    // article:section classifies the subject for AI crawlers: employment vs portfolio
    articleSection: employment ? "employment" : "portfolio",
    // authorLink gives rel="author" a followable profile URL (GEO authoritative-attribution step,
    // HTML projection)
    authorLink: AUTHOR_URL,
    preferredLanguage,
    graph: experienceJsonLd({ experience, preferredLanguage }),
  });
};

// The card image for an experience: the screenshot when the page renders one, and the branded
// banner otherwise. Each carries the alt a scraped card announces.
const experienceCardImage = (headline: string, imageName: string): SocialImage =>
  Option.match(experienceScreenshot(imageName), {
    onNone: () => GLOBAL_SOCIAL_IMAGE,
    onSome: (screenshot) => ({ ...screenshot, alt: `Screenshot of ${headline}` }),
  });

// The shared spine every page head returns.
//
// `authorLink` lives here rather than in `SocialMetaInput`: `socialMeta` builds meta tags and never
// reads it, while `pageHead` uses it to emit the rel="author" <link>. Keeping the field beside its
// only consumer avoids a type contract that promises data the builder ignores.
interface PageHeadSpec extends SocialMetaInput {
  readonly markdownPath: string;
  // The page's own nodes; pageHead prepends the site entities so the whole document is one script
  readonly graph: JsonLdNodes;
  readonly authorLink?: string;
}
