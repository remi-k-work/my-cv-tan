// services, features, and other libraries
import { Effect } from "effect";
import { experienceSeo } from "@/features/meta/domain/helpers";
import { absoluteUrl, markdownTwinUrl } from "@/features/meta/domain/urls";
import { buildContactMd, buildEducationMd, buildHomeMd } from "./twins";
import { buildExperienceMd } from "./detail-twin";

// types
import type { PagePath } from "@/domain/models";
import type { ExperienceList } from "@/features/experience/domain/models";
import type { ContactTwinData, EducationTwinData, HomeTwinData, PageTwin, TwinDataResolver, TwinEntry } from "./models";

type TwinEntrySpec = Omit<TwinEntry, "twinUrl"> & { readonly mdHref: string };

// constants
import { STATIC_PAGES } from "@/features/meta/domain/pages";
import { CONTACT_PATH, DEFAULT_LANGUAGE, EDUCATION_PATH, HOME_PATH } from "@/domain/constants";
import { SOURCE_COPY } from "./copy";

const staticTwin = <Data>(pagePath: PagePath, spec: Omit<PageTwin<Data>, "pagePath" | "mdHref" | "name" | "canonical">): PageTwin<Data> => ({
  ...spec,
  pagePath,
  name: STATIC_PAGES[pagePath].label,
  mdHref: STATIC_PAGES[pagePath].mdHref,
  canonical: absoluteUrl(pagePath),
});

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

const twinEntry = ({ mdHref, ...entry }: TwinEntrySpec): TwinEntry => ({
  ...entry,
  twinUrl: markdownTwinUrl(mdHref, DEFAULT_LANGUAGE),
});

export const PAGE_ENTRIES: ReadonlyArray<TwinEntry> = PAGE_TWINS.map((twin) =>
  twinEntry({
    name: twin.name,
    canonical: twin.canonical,
    mdHref: twin.mdHref,
    summary: twin.summary,
    render: (data) => twin.render(data, SOURCE_COPY),
  })
);

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

export const allEntries = (experienceList: ExperienceList): ReadonlyArray<TwinEntry> => [...PAGE_ENTRIES, ...experienceEntries(experienceList)];
