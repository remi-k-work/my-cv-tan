// services, features, and other libraries
import { Array, Option } from "effect";
import { matchPreferredLanguage } from "@/domain/helpers";
import { isEmployment } from "@/features/experience/domain/helpers";
import { experiencePath, validatedHref } from "@/features/meta/domain/urls";
import { deadEndEscapeLine, detailPagesSection } from "./twin-nav";
import { mdBody, mdBulletList, mdFact, mdHeading, mdLink, mdQuote, mdTitledSection } from "./format";
import { escapeMd, escapeMdInline } from "./escape";
import { twinIdentity } from "./helpers";

// types
import type { ExperienceMdInput, MarkdownTwin, NotFoundMdInput } from "./models";

// constants
import { SITE_NAME } from "@/features/meta/domain/constants";

const optionalLink = (label: string, href: string | undefined): Option.Option<string> => Option.map(validatedHref(href), (url) => mdLink(label, url));

// Builds the Markdown twin for an experience detail page
export const buildExperienceMd = ({ seo, translate }: ExperienceMdInput): MarkdownTwin => {
  const { experience, preferredLanguage, canonical, headline, description } = seo;
  const { role, company, txt, skillsUsed, year } = experience;

  const links = Array.getSomes([
    optionalLink(translate("GitHub Repo"), experience.gitHubLink),
    optionalLink(translate("Live Link"), experience.liveLink),
    optionalLink(translate("Watch Video"), experience.videoLink),
  ]);

  return {
    facts: {
      ...twinIdentity(headline, description, canonical, preferredLanguage),
      type: isEmployment(experience) ? "work-experience" : "project",
      role,
      company,
      year,
      skills: skillsUsed.join(", "),
    },
    body: mdBody([
      mdHeading(1, headline),
      mdQuote(description),
      mdTitledSection(translate("Overview"), escapeMd(txt)),
      mdTitledSection(
        translate("Details"),
        mdBulletList([mdFact(translate("Role"), role), mdFact(translate("Company"), company), mdFact(translate("Year"), year)])
      ),
      mdTitledSection(translate("Skills Used"), mdBulletList(skillsUsed.map(escapeMdInline))),
      ...(links.length > 0 ? [mdTitledSection(translate("Links"), mdBulletList(links))] : []),
      detailPagesSection(preferredLanguage, translate),
    ]),
  };
};

const detailOf = (slug: Option.Option<string>) => Option.map(slug, (value) => ({ slug: value, path: escapeMdInline(experiencePath(value)) }));

// Builds the Markdown 404 response twin
export const buildNotFoundMd = ({ slug, preferredLanguage, translate }: NotFoundMdInput): MarkdownTwin => {
  const title = translate("Not Found");
  const { description, missing } = Option.match(detailOf(slug), {
    onNone: () => ({
      description: matchPreferredLanguage(preferredLanguage, "No page for this address.", "Nie znaleziono strony dla tego adresu."),
      missing: matchPreferredLanguage(preferredLanguage, "No Markdown document exists for this address.", "Dokument Markdown dla tego adresu nie istnieje."),
    }),
    onSome: ({ slug, path }) => ({
      description: matchPreferredLanguage(preferredLanguage, `No page for slug "${slug}".`, `Nie znaleziono strony dla identyfikatora "${slug}".`),
      missing: matchPreferredLanguage(preferredLanguage, `No Markdown document exists for ${path}.`, `Dokument Markdown dla adresu ${path} nie istnieje.`),
    }),
  });

  return {
    facts: { title, description, lang: preferredLanguage, author: SITE_NAME },
    body: mdBody([mdHeading(1, title), missing, deadEndEscapeLine(preferredLanguage, translate)]),
  };
};
