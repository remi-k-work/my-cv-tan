// services, features, and other libraries
import { Array, Option } from "effect";
import { msg } from "gt-i18n";
import { isEmployment } from "@/features/experience/domain/helpers";
import { experiencePath, validatedHref } from "@/features/meta/domain/urls";
import { deadEndEscapeLine, detailPagesSection } from "./twin-nav";
import { mdBody, mdBulletList, mdFact, mdHeading, mdLink, mdQuote, mdTitledSection } from "./format";
import { escapeMd, escapeMdInline } from "./escape";
import { twinIdentity } from "./identity";

// types
import type { PreferredLanguage, Translate } from "@/domain/models";
import type { ExperienceSeo } from "@/features/meta/domain/models";
import type { TwinContext } from "./models";

interface ExperienceMdInput {
  readonly seo: ExperienceSeo;
  readonly translate: Translate;
}

interface NotFoundMdInput extends TwinContext {
  readonly slug: Option.Option<string>;
}

interface NotFoundCopy {
  readonly address: string;
  readonly missingAddress: string;
  readonly slug: (slug: string) => string;
  readonly missingPath: (path: string) => string;
}

// constants
import { SITE_NAME } from "@/features/meta/domain/site";

// 404 prose is not dictionary copy: it is resolved from this exhaustive record so a new language
// cannot silently fall through to another language's message
const NOT_FOUND_COPY = {
  en: {
    address: "No page for this address.",
    missingAddress: "No Markdown document exists for this address.",
    slug: (slug) => `No page for slug "${slug}".`,
    missingPath: (path) => `No Markdown document exists for ${path}.`,
  },
  pl: {
    address: "Nie znaleziono strony dla tego adresu.",
    missingAddress: "Dokument Markdown dla tego adresu nie istnieje.",
    slug: (slug) => `Nie znaleziono strony dla identyfikatora "${slug}".`,
    missingPath: (path) => `Dokument Markdown dla adresu ${path} nie istnieje.`,
  },
} as const satisfies Record<PreferredLanguage, NotFoundCopy>;

const optionalLink = (label: string, href: string | undefined) => Option.map(validatedHref(href), (url) => mdLink(label, url));

// Builds the Markdown twin for an experience detail page
export const buildExperienceMd = ({ seo, translate }: ExperienceMdInput) => {
  const { experience, preferredLanguage, canonical, headline, description } = seo;
  const { role, company, txt, skillsUsed, year } = experience;

  const links = Array.getSomes([
    optionalLink(translate(msg("GitHub Repo")), experience.gitHubLink),
    optionalLink(translate(msg("Live Link")), experience.liveLink),
    optionalLink(translate(msg("Watch Video")), experience.videoLink),
  ]);

  return {
    facts: {
      ...twinIdentity(headline, description, canonical, preferredLanguage),
      type: isEmployment(experience) ? "work-experience" : "project",
      role,
      company,
      year,
      skills: Array.join(skillsUsed, ", "),
    },
    body: mdBody([
      mdHeading(1, headline),
      mdQuote(description),
      mdTitledSection(translate(msg("Overview")), escapeMd(txt)),
      mdTitledSection(
        translate(msg("Details")),
        mdBulletList([mdFact(translate(msg("Role")), role), mdFact(translate(msg("Company")), company), mdFact(translate(msg("Year")), year)])
      ),
      mdTitledSection(translate(msg("Skills Used")), mdBulletList(Array.map(skillsUsed, escapeMdInline))),
      // An experience with no publishable link gets no Links section at all, rather than an empty one
      ...Array.match(links, {
        onEmpty: () => [],
        onNonEmpty: (entries) => [mdTitledSection(translate(msg("Links")), mdBulletList(entries))],
      }),
      detailPagesSection(preferredLanguage, translate),
    ]),
  };
};

const detailOf = (slug: Option.Option<string>) => Option.map(slug, (value) => ({ slug: value, path: escapeMdInline(experiencePath(value)) }));

// Builds the Markdown 404 response twin
export const buildNotFoundMd = ({ slug, preferredLanguage, translate }: NotFoundMdInput) => {
  const title = translate(msg("Not Found"));
  const copy = NOT_FOUND_COPY[preferredLanguage];
  const { description, missing } = Option.match(detailOf(slug), {
    onNone: () => ({ description: copy.address, missing: copy.missingAddress }),
    onSome: ({ slug, path }) => ({ description: copy.slug(slug), missing: copy.missingPath(path) }),
  });

  return {
    facts: { title, description, lang: preferredLanguage, author: SITE_NAME },
    body: mdBody([mdHeading(1, title), missing, deadEndEscapeLine(preferredLanguage, translate)]),
  };
};
