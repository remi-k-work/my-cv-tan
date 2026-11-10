// services, features, and other libraries
import { Option } from "effect";
import { matchPreferredLanguage } from "@/domain/helpers";
import { isEmployment } from "@/features/experience/domain/helpers";
import { experienceSeo } from "./seo";
import { jsonLdGraph } from "./jsonld";
import { contactJsonLd, educationJsonLd, experienceJsonLd, homeJsonLd } from "./page-graphs";
import { globalSocialImage, socialMeta } from "./social-meta";
import { staticPageCopy } from "./pages";
import { canonicalLink, markdownAlternateLink } from "./link-tags";

// types
import type { ExperienceHeadInput } from "./seo";
import type { JsonLdNodes, PageHead, SocialImage, SocialImageFacts, SocialMetaInput, StaticPageCopy } from "./models";
import type { PageTitles, PreferredLanguage } from "@/domain/models";
import type { EducationList } from "@/features/education/domain/models";
import type { ExperienceList } from "@/features/experience/domain/models";

// The ingredients of one indexable page head: its social facts, its Markdown twin and its graph
interface PageHeadSpec {
  readonly social: SocialMetaInput;
  readonly markdownPath: string;
  readonly graph: JsonLdNodes;
}

// The loader-provided inputs every static page head shares
interface StaticPageHeadInput {
  readonly pageTitles: PageTitles;
  readonly preferredLanguage: PreferredLanguage;
}

// constants
import { INDEXABLE_ROBOTS } from "@/domain/http";
import { CONTACT_PATH, EDUCATION_PATH, HOME_PATH } from "@/domain/constants";
import { BRANDED_TITLE, SITE_NODES } from "./site";

export const pageHead = ({ social, markdownPath, graph }: PageHeadSpec): PageHead => ({
  meta: [
    { title: BRANDED_TITLE(social.title) },
    { name: "description", content: social.description },
    { name: "robots", content: INDEXABLE_ROBOTS },
    ...socialMeta(social),
  ],
  links: [canonicalLink(social.canonical), markdownAlternateLink(markdownPath, social.preferredLanguage)],
  scripts: [jsonLdGraph([...SITE_NODES, ...graph])],
});

const experienceCardImage = (headline: string, image: Option.Option<SocialImageFacts>, preferredLanguage: PreferredLanguage): SocialImage =>
  Option.match(image, {
    onNone: () => globalSocialImage(preferredLanguage),
    onSome: (screenshot) => ({
      ...screenshot,
      alt: matchPreferredLanguage(preferredLanguage, `Screenshot of ${headline}`, `Zrzut ekranu przedstawiający ${headline}`),
    }),
  });

export const experienceHead = (input: ExperienceHeadInput): PageHead => {
  const seo = experienceSeo(input);

  return pageHead({
    social: {
      title: seo.headline,
      description: seo.description,
      canonical: seo.canonical,
      image: experienceCardImage(seo.headline, seo.screenshot, seo.preferredLanguage),
      preferredLanguage: seo.preferredLanguage,
      ogType: "article",
      articleSection: isEmployment(seo.experience) ? "employment" : "portfolio",
    },
    markdownPath: seo.markdownPath,
    graph: experienceJsonLd(seo),
  });
};

const staticPageHead = (copy: StaticPageCopy, graph: JsonLdNodes): PageHead =>
  pageHead({
    social: {
      title: copy.seoTitle,
      description: copy.description,
      canonical: copy.canonical,
      image: globalSocialImage(copy.preferredLanguage),
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
