// --- The twin catalogue ---
//
// Every document the site publishes as Markdown, declared once: the route it serves, the datasets it
// reads, and the body it renders. The service reads these declarations to route a request, and the
// entry projection (see `twinEntry`) turns the same declarations into descriptors the AI indexes
// advertise — so serving a route, publishing it in an index and concatenating it into llms-full.txt
// are one edit instead of three tables that have to agree.
//
// Split from the rendering builders because the catalogue declares *what* is published; the builders
// in pages.ts / experience.ts decide *how* it is rendered.

// services, features, and other libraries
import { Array, Effect } from "effect";
import { absoluteUrl, experienceMarkdownPath, experiencePath, markdownTwinUrl } from "@/features/meta/domain/url";
import { STATIC_PAGES } from "@/features/meta/domain/static-pages";
import { DEFAULT_LANGUAGE } from "@/features/meta/domain/constants";
import { SOURCE_COPY } from "@/features/markdown/domain/constants";
import { buildHomeMd, buildEducationMd, buildContactMd } from "./pages";
import { buildExperienceMd } from "./experience";
import { experienceHeadline } from "@/features/experience/domain/helpers";

// types
import type { PagePath, PageTitles } from "@/domain/models";
import type { EducationList } from "@/features/education/domain/models";
import type { Experience, ExperienceList } from "@/features/experience/domain/models";
import type { LocalizedMdInput } from "./models";
import type { DatasetsService } from "@/features/meta/services/datasets";
import type { RequiredDataError } from "@/features/data/domain/required";

// One localized dataset plus every dataset, bundled so a single render call can serve any twin.
export interface TwinData {
  readonly pageTitles: PageTitles;
  readonly experienceList: ExperienceList;
  readonly educationList: EducationList;
}

// One published machine-readable document. `twinUrl` is the ?lang-pinned .md route, so a crawler
// following an index fetches exactly the document `render` produces instead of a variant locale
// negotiation happens to resolve. `canonical` is the clean HTML URL — the citation target AI
// systems reference when quoting the document.
export interface TwinEntrySpec {
  readonly name: string;
  readonly canonical: string;
  readonly twinUrl: string;
  readonly render: (data: TwinData) => string;
}

// A page twin also carries the one-line description llms.txt prints beside its link.
export interface PageEntrySpec extends TwinEntrySpec {
  readonly summary: string;
}

// One page twin, declared over exactly the datasets it renders. `Data` is inferred from the
// resolver, so a resolver handing back a list its body never reads — or a body destructuring a
// list its resolver never fetches — is a type error rather than a silently undefined field at
// render time. A twin that renders no dataset declares the empty record: it resolves nothing at
// all, so a failure in an unrelated asset cannot turn the contact twin into a 503.
//
// `mdHref` is read off the static-page table rather than spelled here: the table is the one
// declaration of which Markdown route serves which page, and the HTML head reads its twin link from
// the same row. This keeps the route, the twin declaration, and the HTML <link rel="alternate"> in
// sync by construction.
export interface PageTwinSpec<Data> {
  readonly pagePath: PagePath;
  readonly mdHref: string;
  // The label every index prints for this twin, and the route's name on the Markdown service
  readonly name: string;
  // The one-line description llms.txt prints beside its link
  readonly summary: string;
  readonly resolve: (datasets: DatasetsService, preferredLanguage: LocalizedMdInput["preferredLanguage"]) => Effect.Effect<Data, RequiredDataError>;
  readonly body: (pageTitles: PageTitles, data: Data, context: LocalizedMdInput) => string;
}

// Reads the Markdown route the static-page table already declares for `pagePath`, so a twin's own
// declaration and the HTML head's twin link are the same row instead of two spellings.
const pageTwin = <Data>(
  pagePath: PagePath,
  spec: Omit<PageTwinSpec<Data>, "pagePath" | "mdHref">
): PageTwinSpec<Data> => ({ ...spec, pagePath, mdHref: STATIC_PAGES[pagePath].mdHref });

// Projects a page twin declaration into the descriptor an index advertises. The canonical and
// twin URL are derived from the same helpers the twin routes serve, so an index can never advertise
// a spelling the served document would not answer to.
const twinEntry = (input: {
  readonly name: string;
  readonly canonicalPath: string;
  readonly mdHref: string;
  readonly render: (data: TwinData) => string;
}): TwinEntrySpec => ({
  name: input.name,
  canonical: absoluteUrl(input.canonicalPath),
  twinUrl: markdownTwinUrl(input.mdHref, DEFAULT_LANGUAGE),
  render: input.render,
});

// --- The three static page twins ---
// Named individually as well as listed, because the service routes them by these names while
// everything else walks the list. Declaration order is the order the indexes lead with, so the
// homepage stays the primary entry.

export const HOME_TWIN: PageTwinSpec<{ readonly experienceList: ExperienceList }> = pageTwin("/", {
  name: "Home",
  summary: "portfolio overview with experience and project lists.",
  resolve: (datasets, preferredLanguage) => Effect.map(datasets.experienceList(preferredLanguage), (experienceList) => ({ experienceList })),
  body: (pageTitles, { experienceList }, context) => buildHomeMd({ pageTitles, experienceList, ...context }),
});

export const EDUCATION_TWIN: PageTwinSpec<{ readonly educationList: EducationList }> = pageTwin("/education", {
  name: "Education & Certificates",
  summary: "schools, courses and certificates.",
  resolve: (datasets, preferredLanguage) => Effect.map(datasets.educationList(preferredLanguage), (educationList) => ({ educationList })),
  body: (pageTitles, { educationList }, context) => buildEducationMd({ pageTitles, educationList, ...context }),
});

export const CONTACT_TWIN: PageTwinSpec<{}> = pageTwin("/contact", {
  name: "Contact",
  summary: "contact form, location and social profiles.",
  // Renders no dataset, so it resolves none: the constant empty record is the whole resolver
  resolve: () => Effect.succeed({}),
  body: (pageTitles, _data, context) => buildContactMd({ pageTitles, ...context }),
});

export const PAGE_TWINS = [HOME_TWIN, EDUCATION_TWIN, CONTACT_TWIN] as const;

// The page descriptors llms.txt advertises: the canonical HTML URL to cite, the language-pinned twin
// to fetch, and the one-line summary a fetcher reads before deciding which to load. Read off the
// declaration itself, so an index cannot advertise a twin the route does not serve, or the reverse.
//
// A constant rather than a function: every field is a static site fact, so recomputing three objects
// and three absolute URLs per request bought nothing but allocation.
export const PAGE_ENTRIES: ReadonlyArray<PageEntrySpec> = Array.map(PAGE_TWINS, (twin): PageEntrySpec => ({
  ...twinEntry({
    name: twin.name,
    canonicalPath: twin.pagePath,
    // The twin declares its own route, so the entry and the route serve one URL
    mdHref: twin.mdHref,
    render: (data) => twin.body(data.pageTitles, data, SOURCE_COPY),
  }),
  summary: twin.summary,
}));

// One row per experience. The entry closes over its own experience, so rendering a detail twin needs
// no context at all: the descriptor is the whole document.
const experienceEntries = (experienceList: ExperienceList): ReadonlyArray<TwinEntrySpec> =>
  Array.map(experienceList, (experience) =>
    twinEntry({
      name: experienceHeadline(experience, DEFAULT_LANGUAGE),
      canonicalPath: experiencePath(experience.slug),
      mdHref: experienceMarkdownPath(experience.slug),
      render: () => buildExperienceMd({ experience, ...SOURCE_COPY }),
    })
  );

// Every published document in the order the indexes read them: the three page twins first, then
// every detail twin in portfolio order.
export const allEntries = (experienceList: ExperienceList): ReadonlyArray<TwinEntrySpec> => [...PAGE_ENTRIES, ...experienceEntries(experienceList)];
