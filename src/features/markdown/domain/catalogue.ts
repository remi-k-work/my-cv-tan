// Markdown twin catalogue declaring static and dynamic document descriptors.

// services, features, and other libraries
import { Effect } from "effect";
import { experienceHeadline } from "@/features/experience/domain/helpers";
import { absoluteUrl, experienceMarkdownPath, experiencePath, markdownTwinUrl } from "@/features/meta/domain/url";
import { buildExperienceMd } from "./experience";
import { buildContactMd, buildEducationMd, buildHomeMd } from "./pages";

// types
import type { PagePath, PageTitles, PreferredLanguage } from "@/domain/models";
import type { DatasetsService } from "@/features/data/services/datasets";
import type { RequiredDataError } from "@/features/data/domain/required";
import type { EducationList } from "@/features/education/domain/models";
import type { ExperienceList } from "@/features/experience/domain/models";
import type { LocalizedMdInput } from "./formatting";

export interface TwinData {
  readonly pageTitles: PageTitles;
  readonly experienceList: ExperienceList;
  readonly educationList: EducationList;
}

interface TwinEntry {
  readonly name: string;
  readonly canonical: string;
  readonly twinUrl: string;
  readonly summary?: string;
  readonly render: (data: TwinData) => string;
}

export interface PageTwinSpec<Data> {
  readonly pagePath: PagePath;
  readonly mdHref: string;
  readonly name: string;
  readonly summary: string;
  readonly resolve: (datasets: DatasetsService, preferredLanguage: PreferredLanguage) => Effect.Effect<Data, RequiredDataError>;
  readonly body: (pageTitles: PageTitles, data: Data, context: LocalizedMdInput) => string;
}

// constants
import { DEFAULT_LANGUAGE } from "@/features/meta/domain/constants";
import { CONTACT_PATH, EDUCATION_PATH, HOME_PATH, STATIC_PAGES } from "@/features/meta/domain/static-pages";
import { SOURCE_COPY } from "./formatting";

const pageTwin = <Data>(pagePath: PagePath, spec: Omit<PageTwinSpec<Data>, "pagePath" | "mdHref">): PageTwinSpec<Data> => ({
  ...spec,
  pagePath,
  mdHref: STATIC_PAGES[pagePath].mdHref,
});

const twinEntry = (input: {
  readonly name: string;
  readonly canonicalPath: string;
  readonly mdHref: string;
  readonly summary?: string;
  readonly render: (data: TwinData) => string;
}): TwinEntry => ({
  name: input.name,
  canonical: absoluteUrl(input.canonicalPath),
  twinUrl: markdownTwinUrl(input.mdHref, DEFAULT_LANGUAGE),
  summary: input.summary,
  render: input.render,
});

export const HOME_TWIN: PageTwinSpec<{ readonly experienceList: ExperienceList }> = pageTwin(HOME_PATH, {
  name: "Home",
  summary: "portfolio overview with experience and project lists.",
  resolve: (datasets, preferredLanguage) => Effect.map(datasets.experienceList(preferredLanguage), (experienceList) => ({ experienceList })),
  body: (pageTitles, { experienceList }, context) => buildHomeMd({ pageTitles, experienceList, ...context }),
});

export const EDUCATION_TWIN: PageTwinSpec<{ readonly educationList: EducationList }> = pageTwin(EDUCATION_PATH, {
  name: "Education & Certificates",
  summary: "schools, courses and certificates.",
  resolve: (datasets, preferredLanguage) => Effect.map(datasets.educationList(preferredLanguage), (educationList) => ({ educationList })),
  body: (pageTitles, { educationList }, context) => buildEducationMd({ pageTitles, educationList, ...context }),
});

export const CONTACT_TWIN: PageTwinSpec<{}> = pageTwin(CONTACT_PATH, {
  name: "Contact",
  summary: "contact form, location and social profiles.",
  resolve: () => Effect.succeed({}),
  body: (pageTitles, _data, context) => buildContactMd({ pageTitles, ...context }),
});

export const PAGE_TWINS = [HOME_TWIN, EDUCATION_TWIN, CONTACT_TWIN] as const;

// Static page twin descriptors for AI index publication.
export const PAGE_ENTRIES: ReadonlyArray<TwinEntry> = PAGE_TWINS.map((twin) =>
  twinEntry({
    name: twin.name,
    canonicalPath: twin.pagePath,
    mdHref: twin.mdHref,
    summary: twin.summary,
    render: (data) => twin.body(data.pageTitles, data, SOURCE_COPY),
  })
);

const experienceEntries = (experienceList: ExperienceList): ReadonlyArray<TwinEntry> =>
  experienceList.map((experience) =>
    twinEntry({
      name: experienceHeadline(experience, DEFAULT_LANGUAGE),
      canonicalPath: experiencePath(experience.slug),
      mdHref: experienceMarkdownPath(experience.slug),
      render: () => buildExperienceMd({ experience, ...SOURCE_COPY }),
    })
  );

// All static and detail entries in index order.
export const allEntries = (experienceList: ExperienceList): ReadonlyArray<TwinEntry> => [...PAGE_ENTRIES, ...experienceEntries(experienceList)];
