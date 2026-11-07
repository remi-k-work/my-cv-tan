// The documents the {$slug}.md route answers with: the detail twin built from one experience's
// published SEO record, and the 404 twin an unknown or unparseable slug receives. Both restate the
// same identity the HTML head and the JSON-LD graph publish, so they are derived here rather than
// independently per surface. The static page twins live in ./twins.

// services, features, and other libraries
import { Array, Option } from "effect";
import { matchPreferredLanguage } from "@/domain/helpers";
import { isEmployment } from "@/features/experience/domain/helpers";

// meta (shared)
import { SITE_NAME } from "@/features/meta/domain/identity";
import { experiencePath, validatedHref } from "@/features/meta/domain/urls";

// domain
import { twinIdentity } from "./copy";
import { deadEndEscapeLine, detailPagesSection } from "./twin-nav";

// formatting primitives
import { escapeMd, escapeMdInline } from "./escape";
import { mdBody, mdBulletList, mdFact, mdHeading, mdLink, mdQuote, mdTitledSection } from "./format";

// types
import type { ExperienceMdInput, MarkdownTwin, NotFoundMdInput } from "./models";

// Formats an optional web link line for a bullet list. Absent values and non-http/https URLs are
// both omitted: the Experience schema accepts any non-empty string, so this is the one place a
// hostile scheme is stopped before it reaches a crawler-parseable document.
const optionalLink = (label: string, href: string | undefined): Option.Option<string> => Option.map(validatedHref(href), (url) => mdLink(label, url));

// Builds the Markdown twin for an experience detail page from its SEO record.
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
      ...twinIdentity({ title: headline, description, canonical, preferredLanguage }),
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

// The raw slug is quoted inside YAML frontmatter; the path is escaped for the Markdown body.
const detailOf = (slug: Option.Option<string>) => Option.map(slug, (value) => ({ slug: value, path: escapeMdInline(experiencePath(value)) }));

// Builds the Markdown 404 twin, with the escape links a dead-end document walks a reader through.
export const buildNotFoundMd = ({ slug, preferredLanguage, translate }: NotFoundMdInput): MarkdownTwin => {
  const title = translate("Not Found");
  const detail = detailOf(slug);

  const description = Option.match(detail, {
    onNone: () => matchPreferredLanguage(preferredLanguage, "No page for this address.", "Nie znaleziono strony dla tego adresu."),
    onSome: ({ slug: s }) => matchPreferredLanguage(preferredLanguage, `No page for slug "${s}".`, `Nie znaleziono strony dla identyfikatora "${s}".`),
  });

  const missing = Option.match(detail, {
    onNone: () => matchPreferredLanguage(preferredLanguage, "No Markdown document exists for this address.", "Dokument Markdown dla tego adresu nie istnieje."),
    onSome: ({ path }) =>
      matchPreferredLanguage(preferredLanguage, `No Markdown document exists for ${path}.`, `Dokument Markdown dla adresu ${path} nie istnieje.`),
  });

  // A dead-end document has no canonical to cite and no brand to promote: it identifies the
  // request, not a page, so its facts stay the bare identity rather than the twins' branded set.
  return {
    facts: { title, description, lang: preferredLanguage, author: SITE_NAME },
    body: mdBody([mdHeading(1, title), missing, deadEndEscapeLine(preferredLanguage, translate)]),
  };
};
