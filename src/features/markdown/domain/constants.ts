// services, features, and other libraries
import { Effect } from "effect";
import { translateSource } from "@/domain/helpers";
import { absoluteUrl, markdownTwinUrl } from "@/features/meta/domain/urls";
import { buildContactMd, buildEducationMd, buildHomeMd } from "./twins";

// types
import type { PagePath } from "@/domain/models";
import type { ContactTwinData, EducationTwinData, HomeTwinData, PageTwin, TwinEntry, TwinEntrySpec } from "./models";

// constants
import { CONTACT_PATH, DEFAULT_LANGUAGE, EDUCATION_PATH, HOME_PATH } from "@/domain/constants";
import { STATIC_PAGES } from "@/features/meta/domain/pages";

export const SOURCE_COPY = { preferredLanguage: DEFAULT_LANGUAGE, translate: translateSource } as const;

const staticTwin = <Data>(pagePath: PagePath, spec: Omit<PageTwin<Data>, "pagePath" | "mdHref" | "name" | "canonical">): PageTwin<Data> => ({
  ...spec,
  pagePath,
  name: STATIC_PAGES[pagePath].label,
  mdHref: STATIC_PAGES[pagePath].mdHref,
  canonical: absoluteUrl(pagePath),
});

export const HOME_TWIN: PageTwin<HomeTwinData> = staticTwin(HOME_PATH, {
  summary: "portfolio overview with experience and project lists.",
  resolveData: (datasets, preferredLanguage) =>
    Effect.all(
      { pageTitles: datasets.pageTitles(preferredLanguage), experienceList: datasets.experienceList(preferredLanguage) },
      { concurrency: "unbounded" }
    ),
  render: (data, context) => buildHomeMd({ ...data, ...context }),
});

export const EDUCATION_TWIN: PageTwin<EducationTwinData> = staticTwin(EDUCATION_PATH, {
  summary: "schools, courses and certificates.",
  resolveData: (datasets, preferredLanguage) =>
    Effect.all({ pageTitles: datasets.pageTitles(preferredLanguage), educationList: datasets.educationList(preferredLanguage) }, { concurrency: "unbounded" }),
  render: (data, context) => buildEducationMd({ ...data, ...context }),
});

export const CONTACT_TWIN: PageTwin<ContactTwinData> = staticTwin(CONTACT_PATH, {
  summary: "contact form, location and social profiles.",
  resolveData: (datasets, preferredLanguage) => Effect.map(datasets.pageTitles(preferredLanguage), (pageTitles) => ({ pageTitles })),
  render: (data, context) => buildContactMd({ ...data, ...context }),
});

export const PAGE_TWINS = [HOME_TWIN, EDUCATION_TWIN, CONTACT_TWIN] as const;

export const TWIN_ENTRY = ({ mdHref, ...entry }: TwinEntrySpec): TwinEntry => ({ ...entry, twinUrl: markdownTwinUrl(mdHref, DEFAULT_LANGUAGE) });

export const PAGE_ENTRIES: ReadonlyArray<TwinEntry> = PAGE_TWINS.map(({ name, canonical, mdHref, summary, render }) =>
  TWIN_ENTRY({ name, canonical, mdHref, summary, render: (data) => render(data, SOURCE_COPY) })
);
