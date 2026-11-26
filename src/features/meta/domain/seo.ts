// Shared experience projections keep stable identity, narrative content and head-only image facts
// aligned without making each consumer compute metadata it does not publish.

// services, features, and other libraries
import { Array, Option, String, pipe } from "effect";
import { excerpt, experienceHeadline, experienceImagePath, isEmployment } from "@/features/experience/domain/helpers";
import { absoluteUrl, experiencePath, validatedHref } from "./urls";

// types
import type { Experience } from "@/features/experience/domain/models";
import type { ExperienceContent, ExperienceIdentity, ExperienceIdentityInput, ExperienceSection, ExperienceSeo, SocialImageFacts } from "./models";

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

// Normalizes whitespace before deduplicating so HTML JSON-LD keywords and Markdown skills stay identical
export const experienceKeywords = ({ skillsUsed }: Pick<Experience, "skillsUsed">): ReadonlyArray<string> =>
  pipe(skillsUsed, Array.map(inlineText), Array.filter(String.isNonEmpty), Array.dedupe);

// Validates authored external URLs once so JSON-LD and Markdown twins enforce identical destination safety
export const experienceLinks = ({ gitHubLink, liveLink, videoLink }: Pick<Experience, "gitHubLink" | "liveLink" | "videoLink">) => ({
  repository: validatedHref(gitHubLink),
  live: validatedHref(liveLink),
  video: validatedHref(videoLink),
});

export const experienceIdentity = ({ experience, preferredLanguage }: ExperienceIdentityInput): ExperienceIdentity => {
  const path = experiencePath(experience.slug);

  return {
    preferredLanguage,
    path,
    canonical: absoluteUrl(path),
    markdownPath: `${path}.md`,
    headline: inlineText(experienceHeadline(experience, preferredLanguage)),
  };
};

export const experienceContent = (input: ExperienceIdentityInput): ExperienceContent => ({
  ...experienceIdentity(input),
  experience: input.experience,
  description: excerpt(inlineText(input.experience.txt), META_DESCRIPTION_LENGTH),
});

export const experienceSeo = (input: ExperienceIdentityInput): ExperienceSeo => ({
  ...experienceContent(input),
  screenshot: experienceScreenshot(input.experience.imageName),
});
