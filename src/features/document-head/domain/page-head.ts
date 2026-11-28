// services, features, and other libraries
import { Option } from "effect";
import { experienceImageAlt, experienceSection, experienceSeo } from "@/features/experience/domain/seo";
import { jsonLdGraph } from "@/features/jsonld/domain/serialize";
import { contactJsonLd, educationJsonLd, experienceJsonLd, homeJsonLd } from "@/features/jsonld/domain/page-graphs";
import { globalSocialImage, socialMeta } from "./social";
import { staticPageCopy } from "@/domain/pages";
import { canonicalAndDiscoveryLinks, markdownRepresentationLink } from "@/domain/links";

// types
import type { JsonLdNodes } from "@/features/jsonld/domain/models";
import type { PageHead, SocialImage, SocialMetaInput } from "./models";
import type { StaticPageCopy } from "@/domain/pages";
import type { EducationList, ImageFacts, PagePath, PageTitles, PreferredLanguage } from "@/domain/models";
import type { ExperienceIdentityInput, ExperienceList } from "@/features/experience/domain/models";

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
import { BRANDED_TITLE } from "@/domain/site";
import { SITE_NODES } from "@/features/jsonld/domain/site-nodes";

export const pageHead = ({ social, markdownPath, graph }: PageHeadSpec): PageHead => ({
  meta: [
    { title: BRANDED_TITLE(social.title) },
    { name: "description", content: social.description },
    { name: "robots", content: INDEXABLE_ROBOTS },
    ...socialMeta(social),
  ],
  // The canonical leads, then the current-language Markdown twin: it is pinned so the twin answers
  // the representation this HTML response advertises, while the negotiated HTML URL stays canonical
  links: [...canonicalAndDiscoveryLinks(social.canonical), markdownRepresentationLink(markdownPath, social.preferredLanguage)],
  scripts: [jsonLdGraph([...SITE_NODES, ...graph])],
});

const experienceCardImage = (title: string, image: Option.Option<ImageFacts>, preferredLanguage: PreferredLanguage): SocialImage =>
  Option.match(image, {
    onNone: () => globalSocialImage(preferredLanguage),
    onSome: (screenshot) => ({
      ...screenshot,
      alt: experienceImageAlt(title, preferredLanguage),
    }),
  });

export const experienceHead = (input: ExperienceIdentityInput): PageHead => {
  const seo = experienceSeo(input);

  return pageHead({
    social: {
      title: seo.title,
      description: seo.description,
      canonical: seo.canonical,
      image: experienceCardImage(seo.title, seo.screenshot, seo.preferredLanguage),
      preferredLanguage: seo.preferredLanguage,
      ogType: "article",
      articleSection: experienceSection(seo.experience),
    },
    markdownPath: seo.markdownPath,
    graph: experienceJsonLd(seo),
  });
};

// Resolves the page's copy once, then derives its graph from that same copy, so the head and the
// graph can never name different descriptions, languages or canonical URLs
const staticPageHead = (input: StaticPageHeadInput, path: PagePath, graph: (copy: StaticPageCopy) => JsonLdNodes): PageHead => {
  const copy = staticPageCopy(input.pageTitles, path, input.preferredLanguage);

  return pageHead({
    social: {
      title: copy.title,
      description: copy.description,
      canonical: copy.canonical,
      image: globalSocialImage(copy.preferredLanguage),
      preferredLanguage: copy.preferredLanguage,
    },
    markdownPath: copy.mdHref,
    graph: graph(copy),
  });
};

export const homeHead = (input: StaticPageHeadInput & { readonly experienceList: ExperienceList }): PageHead =>
  staticPageHead(input, HOME_PATH, (copy) => homeJsonLd({ ...copy, experienceList: input.experienceList }));

export const educationHead = (input: StaticPageHeadInput & { readonly educationList: EducationList }): PageHead =>
  staticPageHead(input, EDUCATION_PATH, (copy) => educationJsonLd({ ...copy, educationList: input.educationList }));

export const contactHead = (input: StaticPageHeadInput): PageHead => staticPageHead(input, CONTACT_PATH, contactJsonLd);
