// --- Detail Markdown twin ---
//
// An AI index cites the clean canonical HTML URL instead and names the twin beside it: the index
// tells its fetchers to cite the canonical, so an entry offering only the `.md` route would ask for
// a citation it cannot produce.

// services, features, and other libraries
import { Array, Option, pipe } from "effect";
import { msg } from "gt-tanstack-start";
import { experienceHeadline, excerpt } from "@/features/experience/domain/helpers";
import { absoluteUrl, experienceMarkdownPath, experiencePath } from "@/features/meta/domain/url";
import { escapeMd, escapeMdInline } from "./text";
import { frontmatter, mdBulletList, mdDocument, mdEmptyMarker, mdExternalLink, mdFact, mdHeading, mdQuote, mdTitledSection, twinIdentity, twinLink } from "./blocks";
import { detailIndexLinks } from "./document-graph";

// types
import type { PreferredLanguage } from "@/domain/models";
import type { Experience } from "@/features/experience/domain/models";
import type { ExperienceEntryLink, ExperienceLinesInput, ExperienceMdInput } from "./models";

// constants
import { META_DESCRIPTION_LENGTH } from "@/features/meta/domain/constants";
import { LIST_EXCERPT_LENGTH } from "./constants";

// Optional link bullet: an absent href or a non-web URL (rejected by mdExternalLink) drops the line.
// Only http/https protocols are published, so mailto: or javascript: links never reach the twin.
// `mdExternalLink` already decodes the URL and filters by protocol, so this is a thin wrapper that
// turns an optional href into an optional rendered bullet.
const optionalBulletLink = (label: string, href: string | undefined) =>
  pipe(
    Option.fromNullishOr(href),
    Option.flatMap((href) => mdExternalLink(label, href))
  );

// The twin an entry can fetch, pinned to the language it renders in. Pinned with ?lang= so a Polish
// reader following a link from a Polish twin lands on the Polish twin, not the negotiated default.
const twinUrlOf = (experience: Experience, preferredLanguage: PreferredLanguage) => twinLink(experienceMarkdownPath(experience.slug), preferredLanguage);

// One line per experience in a list, with a summary bounded separately from the meta description cap.
//
// A Markdown document navigates to the twin, because pulling its reader into HTML mid-document is
// the wrong surface for an AI reader already inside Markdown. An AI index cites the clean canonical
// HTML URL instead and names the twin beside it: the index tells its fetchers to cite the canonical,
// so an entry offering only the `.md` route would ask for a citation it cannot produce. The `entry`
// discriminator decides which spelling leads: `twin` for sibling navigation inside a twin, `canonical`
// for citations in an AI index.
const experienceLine = (experience: Experience, preferredLanguage: PreferredLanguage, entry: ExperienceEntryLink) => {
  const headline = escapeMdInline(experienceHeadline(experience, preferredLanguage));
  const summary = `${escapeMdInline(excerpt(experience.txt, LIST_EXCERPT_LENGTH))} (${escapeMdInline(experience.year)})`;
  const twin = twinUrlOf(experience, preferredLanguage);

  return entry === "twin"
    ? `- [${headline}](${twin}): ${summary}`
    : `- [${headline}](${absoluteUrl(experiencePath(experience.slug))}): ${summary} Markdown: ${twin}`;
};

// Section body lines for one experience type, or an explicit empty marker (never a bare heading).
// translate and preferredLanguage are required inputs, never defaults: every caller names the
// language it renders, so an index line can never silently disagree with the twin it advertises.
// `Array.match` on the filtered list keeps the empty case explicit — an empty section publishes the
// marker instead of a heading that reads as truncated content.
export const experienceLines = ({ experienceList, type, translate, preferredLanguage, entry }: ExperienceLinesInput) =>
  Array.match(
    Array.filter(experienceList, (experience) => experience.type === type),
    {
      onEmpty: () => mdEmptyMarker(translate),
      onNonEmpty: (experiences) => Array.join(Array.map(experiences, (experience) => experienceLine(experience, preferredLanguage, entry)), "\n"),
    }
  );

export const buildExperienceMd = ({ experience, preferredLanguage, translate }: ExperienceMdInput) => {
  const { role, company, txt, skillsUsed, year, slug } = experience;
  const canonical = absoluteUrl(experiencePath(slug));
  const headline = experienceHeadline(experience, preferredLanguage);
  const description = excerpt(txt, META_DESCRIPTION_LENGTH);

  // Only the survived links are published, and a linkless experience omits the section entirely
  // instead of rendering an empty heading that reads as truncated content to an AI parser.
  //
  // `Array.getSomes` collects only the links whose href decoded to an http/https URL; absent hrefs
  // and non-web protocols contribute nothing. The labels reuse the exact source strings the HTML
  // link chips translate ("GitHub Repo", "Live Link", "Watch Video"), so the Polish twin prints the
  // dictionary's Polish labels.
  const links = Array.getSomes([
    optionalBulletLink(translate(msg("GitHub Repo")), experience.gitHubLink),
    optionalBulletLink(translate(msg("Live Link")), experience.liveLink),
    optionalBulletLink(translate(msg("Watch Video")), experience.videoLink),
  ]);

  return mdDocument([
    frontmatter({
      ...twinIdentity({ title: headline, description, canonical, preferredLanguage }),
      // Machine-classifiable entry type (frontmatter mirrors <head> meta for AI indexers)
      type: experience.type === "e" ? "work-experience" : "project",
      role,
      company,
      // datePublished gives AI crawlers a freshness signal they can cite without parsing the body;
      // the source data carries a year only, so it is published as-is rather than fabricated
      datePublished: year,
      skills: Array.join(skillsUsed, ", "),
    }),
    mdHeading(1, headline),
    mdQuote(description),
    mdTitledSection(translate(msg("Overview")), escapeMd(txt)),
    // The fact labels are translated dictionary copy handed straight to mdFact, which neutralizes
    // both halves of the line itself: pre-escaping here would run the escape table a second time
    // and double the backslashes it had already inserted, so the label would render with a stray
    // "\" a YAML reader has to strip instead of the authored text.
    mdTitledSection(
      translate(msg("Details")),
      mdBulletList([mdFact(translate(msg("Role")), role), mdFact(translate(msg("Company")), company), mdFact(translate(msg("Year")), year)])
    ),
    mdTitledSection(translate(msg("Skills Used")), mdBulletList(Array.map(skillsUsed, (skill) => escapeMdInline(skill)))),
    // A linkless experience omits the section entirely instead of rendering an empty heading
    ...Array.match(links, { onEmpty: Array.empty, onNonEmpty: (bullets) => [mdTitledSection(translate(msg("Links")), mdBulletList(bullets))] }),
    // Detail twins are dead ends without this: the home twin and the two AI indexes let a crawler
    // that resolved one slug page walk the rest of the graph instead of backtracking
    mdTitledSection(translate(msg("Pages")), detailIndexLinks(preferredLanguage, translate)),
  ]);
};
