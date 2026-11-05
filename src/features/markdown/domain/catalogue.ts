// The twin catalogue: the single declaration of every Markdown twin the site publishes,
// and the index entries the AI index documents are assembled from. Document builders live
// in ./twins; the catalogue only decides what exists and how each entry is advertised.

// services, features, and other libraries
import { experienceHeadline } from "@/features/experience/domain/helpers";

// meta (shared)
import { STATIC_PAGES } from "@/features/meta/domain/pages";
import { CONTACT_PATH, DEFAULT_LANGUAGE, EDUCATION_PATH, HOME_PATH } from "@/features/meta/domain/constants";
import { absoluteUrl, experienceMarkdownPath, experiencePath, markdownTwinUrl } from "@/features/meta/domain/urls";

// domain
import { SOURCE_COPY, buildContactMd, buildEducationMd, buildExperienceMd, buildHomeMd } from "./twins";

// types
import type { PagePath } from "@/domain/models";
import type { EducationList } from "@/features/education/domain/models";
import type { ExperienceList } from "@/features/experience/domain/models";
import type { PageTwin, TwinData, TwinEntry } from "./models";

const staticTwin = <Data>(pagePath: PagePath, spec: Omit<PageTwin<Data>, "pagePath" | "mdHref">): PageTwin<Data> => ({
  ...spec,
  pagePath,
  mdHref: STATIC_PAGES[pagePath].mdHref,
});

export const HOME_TWIN: PageTwin<{ readonly experienceList: ExperienceList }> = staticTwin(HOME_PATH, {
  name: "Home",
  summary: "portfolio overview with experience and project lists.",
  render: (pageTitles, { experienceList }, context) => buildHomeMd({ pageTitles, experienceList, ...context }),
});

export const EDUCATION_TWIN: PageTwin<{ readonly educationList: EducationList }> = staticTwin(EDUCATION_PATH, {
  name: "Education & Certificates",
  summary: "schools, courses and certificates.",
  render: (pageTitles, { educationList }, context) => buildEducationMd({ pageTitles, educationList, ...context }),
});

export const CONTACT_TWIN: PageTwin<{}> = staticTwin(CONTACT_PATH, {
  name: "Contact",
  summary: "contact form, location and social profiles.",
  render: (pageTitles, _data, context) => buildContactMd({ pageTitles, ...context }),
});

export const PAGE_TWINS = [HOME_TWIN, EDUCATION_TWIN, CONTACT_TWIN] as const;

const twinEntry = ({
  name,
  canonicalPath,
  mdHref,
  summary,
  render,
}: {
  readonly name: string;
  readonly canonicalPath: string;
  readonly mdHref: string;
  readonly summary?: string;
  readonly render: (data: TwinData) => string;
}): TwinEntry => ({
  name,
  canonical: absoluteUrl(canonicalPath),
  twinUrl: markdownTwinUrl(mdHref, DEFAULT_LANGUAGE),
  summary,
  render,
});

// Static page entries for AI index publication.
export const PAGE_ENTRIES: ReadonlyArray<TwinEntry> = PAGE_TWINS.map((twin) =>
  twinEntry({
    name: twin.name,
    canonicalPath: twin.pagePath,
    mdHref: twin.mdHref,
    summary: twin.summary,
    render: (data) => twin.render(data.pageTitles, data, SOURCE_COPY),
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
