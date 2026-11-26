// The SEO identity of an experience: the one record the HTML head, the JSON-LD graph and the
// Markdown twin all derive from, so their canonical URL, headline and description can never drift.

// services, features, and other libraries
import { Option, String, pipe } from "effect";
import { excerpt, experienceHeadline, experienceImagePath, isEmployment } from "@/features/experience/domain/helpers";
import { absoluteUrl, experiencePath } from "./urls";

// types
import type { Experience } from "@/features/experience/domain/models";
import type { ExperienceSection, ExperienceHeadInput, ExperienceSeo, SocialImageFacts } from "./models";

// constants
import { SCREENSHOT_HEIGHT, SCREENSHOT_WIDTH } from "@/features/experience/domain/constants";
import { META_DESCRIPTION_LENGTH } from "./site";

// An empty image name means "no screenshot", so the whole check is one lift into Option: the
// ternary it replaces had to spell both constructors and split the decision across two branches
export const experienceScreenshot = (imageName: string): Option.Option<SocialImageFacts> =>
  pipe(
    String.trim(imageName),
    Option.liftPredicate(String.isNonEmpty),
    Option.map((name): SocialImageFacts => ({
      src: absoluteUrl(experienceImagePath(name, "a")),
      mime: "image/webp",
      width: SCREENSHOT_WIDTH,
      height: SCREENSHOT_HEIGHT,
    }))
  );

// Single source of truth for experience section classification shared across Open Graph and JSON-LD
export const experienceSection = (experience: Pick<Experience, "type">): ExperienceSection => (isEmployment(experience) ? "employment" : "portfolio");

// Search snippets and single-line frontmatter facts collapse layout whitespace to single spaces
export const inlineText = (value: string) => pipe(value, String.replace(/\s+/g, " "), String.trim);

export const experienceSeo = ({ experience, preferredLanguage }: ExperienceHeadInput): ExperienceSeo => {
  const path = experiencePath(experience.slug);

  return {
    experience,
    preferredLanguage,
    path,
    canonical: absoluteUrl(path),
    markdownPath: `${path}.md`,
    headline: inlineText(experienceHeadline(experience, preferredLanguage)),
    description: excerpt(inlineText(experience.txt), META_DESCRIPTION_LENGTH),
    screenshot: experienceScreenshot(experience.imageName),
  };
};
