// The twin catalogue: the single declaration of every Markdown twin the site publishes, and the
// index entries the AI index documents are assembled from. Each static twin is one record — its
// route, its name and canonical from the shared page catalogue, the dataset bundle its body reads,
// how it renders and how it is advertised — so the route, the resolver and the index entry cannot
// describe the page a second way. Document builders live in ./twins and ./detail-twin; the
// catalogue only decides what exists and what each one reads.

// services, features, and other libraries
import { Effect } from "effect";
import { experienceSeo } from "@/features/meta/domain/experience-seo";

// meta (shared)
import { STATIC_PAGES } from "@/features/meta/domain/pages";
import { CONTACT_PATH, EDUCATION_PATH, HOME_PATH } from "@/domain/constants";
import { DEFAULT_LANGUAGE } from "@/features/meta/domain/languages";
import { absoluteUrl, markdownTwinUrl } from "@/features/meta/domain/urls";

// domain
import { SOURCE_COPY } from "./copy";
import { buildContactMd, buildEducationMd, buildHomeMd } from "./twins";
import { buildExperienceMd } from "./detail-twin";

// types
import type { PagePath } from "@/domain/models";
import type { ExperienceList } from "@/features/experience/domain/models";
import type { ContactTwinData, EducationTwinData, HomeTwinData, PageTwin, TwinDataResolver, TwinEntry } from "./models";

// A static twin's route, name and canonical all come from the shared page catalogue, so the twin,
// its index entry and the twin graph can never describe the page under a second address or name.
const staticTwin = <Data>(pagePath: PagePath, spec: Omit<PageTwin<Data>, "pagePath" | "mdHref" | "name" | "canonical">): PageTwin<Data> => ({
  ...spec,
  pagePath,
  name: STATIC_PAGES[pagePath].label,
  mdHref: STATIC_PAGES[pagePath].mdHref,
  canonical: absoluteUrl(pagePath),
});

// Each resolver resolves its twin's own bundle, and only that bundle: the contact twin's body reads
// no portfolio data, so it resolves the titles its heading needs rather than the two lists it would
// discard. Typing each against the bundle its render declares is what keeps the two in step.
const resolveHomeData: TwinDataResolver<HomeTwinData> = (datasets, preferredLanguage) =>
  Effect.all({ pageTitles: datasets.pageTitles(preferredLanguage), experienceList: datasets.experienceList(preferredLanguage) }, { concurrency: "unbounded" });

const resolveEducationData: TwinDataResolver<EducationTwinData> = (datasets, preferredLanguage) =>
  Effect.all({ pageTitles: datasets.pageTitles(preferredLanguage), educationList: datasets.educationList(preferredLanguage) }, { concurrency: "unbounded" });

const resolveContactData: TwinDataResolver<ContactTwinData> = (datasets, preferredLanguage) =>
  Effect.map(datasets.pageTitles(preferredLanguage), (pageTitles) => ({ pageTitles }));

export const HOME_TWIN: PageTwin<HomeTwinData> = staticTwin(HOME_PATH, {
  summary: "portfolio overview with experience and project lists.",
  resolveData: resolveHomeData,
  render: (data, context) => buildHomeMd({ ...data, ...context }),
});

export const EDUCATION_TWIN: PageTwin<EducationTwinData> = staticTwin(EDUCATION_PATH, {
  summary: "schools, courses and certificates.",
  resolveData: resolveEducationData,
  render: (data, context) => buildEducationMd({ ...data, ...context }),
});

export const CONTACT_TWIN: PageTwin<ContactTwinData> = staticTwin(CONTACT_PATH, {
  summary: "contact form, location and social profiles.",
  resolveData: resolveContactData,
  render: (data, context) => buildContactMd({ ...data, ...context }),
});

export const PAGE_TWINS = [HOME_TWIN, EDUCATION_TWIN, CONTACT_TWIN] as const;

// An entry names its identity and its twin route; the URL a fetcher lands on is derived from that
// route here rather than restated by each caller. Both index documents publish the English source,
// so the pin is the site's default language.
type TwinEntrySpec = Omit<TwinEntry, "twinUrl"> & { readonly mdHref: string };

const twinEntry = ({ mdHref, ...entry }: TwinEntrySpec): TwinEntry => ({
  ...entry,
  twinUrl: markdownTwinUrl(mdHref, DEFAULT_LANGUAGE),
});

// Static page entries for AI index publication.
export const PAGE_ENTRIES: ReadonlyArray<TwinEntry> = PAGE_TWINS.map((twin) =>
  twinEntry({
    name: twin.name,
    canonical: twin.canonical,
    mdHref: twin.mdHref,
    summary: twin.summary,
    render: (data) => twin.render(data, SOURCE_COPY),
  })
);

// Detail entries read their headline, canonical and twin route off the same SEO record the HTML
// head and the twin body consume, so an index entry cannot advertise an address its page denies.
const experienceEntries = (experienceList: ExperienceList): ReadonlyArray<TwinEntry> =>
  experienceList.map((experience) => {
    const seo = experienceSeo({ experience, preferredLanguage: DEFAULT_LANGUAGE });

    return twinEntry({
      name: seo.headline,
      canonical: seo.canonical,
      mdHref: seo.markdownPath,
      render: () => buildExperienceMd({ seo, translate: SOURCE_COPY.translate }),
    });
  });

// All static and detail entries in index order.
export const allEntries = (experienceList: ExperienceList): ReadonlyArray<TwinEntry> => [...PAGE_ENTRIES, ...experienceEntries(experienceList)];
