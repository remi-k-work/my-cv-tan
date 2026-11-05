// Page head builders for the three static pages (home, education, contact). Each shares the
// page head layout; only the page graph differs.

// domain
import { pageHead } from "./page-head";
import { staticPageCopy } from "./pages";
import { contactJsonLd, educationJsonLd, homeJsonLd } from "./page-graphs";

// types
import type { JsonLdNodes, PageHead, StaticPageCopy, StaticPageHeadInput } from "./models";
import type { EducationList } from "@/features/education/domain/models";
import type { ExperienceList } from "@/features/experience/domain/models";

// constants
import { CONTACT_PATH, EDUCATION_PATH, GLOBAL_SOCIAL_IMAGE, HOME_PATH } from "./constants";

// Shared layout for the three static pages; only the page graph differs.
const staticPageHead = (copy: StaticPageCopy, graph: JsonLdNodes): PageHead =>
  pageHead({
    social: {
      title: copy.seoTitle,
      description: copy.description,
      canonical: copy.canonical,
      image: GLOBAL_SOCIAL_IMAGE,
      preferredLanguage: copy.preferredLanguage,
    },
    markdownPath: copy.mdHref,
    graph,
  });

export const homeHead = (input: StaticPageHeadInput & { readonly experienceList: ExperienceList }): PageHead => {
  const copy = staticPageCopy(input.pageTitles, HOME_PATH, input.preferredLanguage);
  return staticPageHead(copy, homeJsonLd({ ...copy, experienceList: input.experienceList }));
};

export const educationHead = (input: StaticPageHeadInput & { readonly educationList: EducationList }): PageHead => {
  const copy = staticPageCopy(input.pageTitles, EDUCATION_PATH, input.preferredLanguage);
  return staticPageHead(copy, educationJsonLd({ ...copy, educationList: input.educationList }));
};

export const contactHead = (input: StaticPageHeadInput): PageHead => {
  const copy = staticPageCopy(input.pageTitles, CONTACT_PATH, input.preferredLanguage);
  return staticPageHead(copy, contactJsonLd(copy));
};
