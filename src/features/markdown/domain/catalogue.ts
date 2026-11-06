// The twin catalogue: the single declaration of every Markdown twin the site publishes,
// and the index entries the AI index documents are assembled from. Document builders live
// in ./twins; the catalogue only decides what exists and how each entry is advertised.

// services, features, and other libraries
import { experienceSeo } from "@/features/meta/domain/experience-seo";

// meta (shared)
import { STATIC_PAGES } from "@/features/meta/domain/pages";
import { CONTACT_PATH, DEFAULT_LANGUAGE, EDUCATION_PATH, HOME_PATH } from "@/features/meta/domain/constants";
import { absoluteUrl, markdownTwinUrl } from "@/features/meta/domain/urls";

// domain
import { SOURCE_COPY, buildContactMd, buildEducationMd, buildExperienceMd, buildHomeMd } from "./twins";

// types
import type { PagePath } from "@/domain/models";
import type { ExperienceList } from "@/features/experience/domain/models";
import type { ContactTwinData, EducationTwinData, HomeTwinData, PageTwin, TwinEntry } from "./models";

// A static twin's route, name and canonical all come from the shared page catalogue, so the twin,
// its index entry and the twin graph can never describe the page under a second address or name.
const staticTwin = <Data>(pagePath: PagePath, spec: Omit<PageTwin<Data>, "pagePath" | "mdHref" | "name" | "canonical">): PageTwin<Data> => ({
  ...spec,
  pagePath,
  name: STATIC_PAGES[pagePath].label,
  mdHref: STATIC_PAGES[pagePath].mdHref,
  canonical: absoluteUrl(pagePath),
});

export const HOME_TWIN: PageTwin<HomeTwinData> = staticTwin(HOME_PATH, {
  summary: "portfolio overview with experience and project lists.",
  render: (data, context) => buildHomeMd({ ...data, ...context }),
});

export const EDUCATION_TWIN: PageTwin<EducationTwinData> = staticTwin(EDUCATION_PATH, {
  summary: "schools, courses and certificates.",
  render: (data, context) => buildEducationMd({ ...data, ...context }),
});

// The contact twin's body reads no portfolio dataset, so it declares only the titles its heading
// needs rather than the full TwinData bundle every index entry renders from.
export const CONTACT_TWIN: PageTwin<ContactTwinData> = staticTwin(CONTACT_PATH, {
  summary: "contact form, location and social profiles.",
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
