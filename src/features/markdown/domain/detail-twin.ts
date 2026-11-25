// services, features, and other libraries
import { Array, Option } from "effect";
import { msg } from "gt-i18n";
import { isEmployment } from "@/features/experience/domain/helpers";
import { validatedHref } from "@/features/meta/domain/urls";
import { canonicalSourceLink, detailPagesSection } from "./twin-nav";
import { mdBody, mdBulletList, mdFact, mdHeading, mdLink, mdQuote, mdTitledSection } from "./format";
import { escapeMd, escapeMdInline } from "./escape";
import { twinIdentity } from "./identity";

// types
import type { ExperienceSeo } from "@/features/meta/domain/models";
import type { TwinContext } from "./models";

interface ExperienceMdInput extends Pick<TwinContext, "translate" | "includeNavigation"> {
  readonly seo: ExperienceSeo;
}

const optionalLink = (label: string, href: string | undefined) => Option.map(validatedHref(href), (url) => mdLink(label, url));

// Builds the Markdown twin for an experience detail page
export const buildExperienceMd = ({ seo, translate, includeNavigation = true }: ExperienceMdInput) => {
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
      ...(includeNavigation ? [canonicalSourceLink(canonical)] : []),
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
      ...(includeNavigation ? [detailPagesSection(preferredLanguage, translate)] : []),
    ]),
  };
};
