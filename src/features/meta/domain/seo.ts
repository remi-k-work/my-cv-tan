// The SEO identity of an experience: the one record the HTML head, the JSON-LD graph and the
// Markdown twin all derive from, so their canonical URL, headline and description can never drift.

// services, features, and other libraries
import { Option, String } from "effect";
import { excerpt, experienceHeadline, experienceImagePath } from "@/features/experience/domain/helpers";
import { absoluteUrl, experienceMarkdownPath, experiencePath } from "./urls";

// types
import type { PreferredLanguage } from "@/domain/models";
import type { Experience } from "@/features/experience/domain/models";
import type { ExperienceSeo, SocialImageFacts } from "./models";

// What every caller must supply to derive an experience's SEO identity
export interface ExperienceHeadInput {
  readonly experience: Experience;
  readonly preferredLanguage: PreferredLanguage;
}

// constants
import { SCREENSHOT_HEIGHT, SCREENSHOT_WIDTH } from "@/features/experience/domain/constants";
import { META_DESCRIPTION_LENGTH } from "./site";

export const experienceScreenshot = (imageName: string): Option.Option<SocialImageFacts> => {
  const name = String.trim(imageName);

  return String.isNonEmpty(name)
    ? Option.some({
        src: absoluteUrl(experienceImagePath(name, "a")),
        mime: "image/webp",
        width: SCREENSHOT_WIDTH,
        height: SCREENSHOT_HEIGHT,
      })
    : Option.none();
};

export const experienceSeo = ({ experience, preferredLanguage }: ExperienceHeadInput): ExperienceSeo => {
  const path = experiencePath(experience.slug);

  return {
    experience,
    preferredLanguage,
    path,
    canonical: absoluteUrl(path),
    markdownPath: experienceMarkdownPath(experience.slug),
    headline: experienceHeadline(experience, preferredLanguage),
    description: excerpt(experience.txt, META_DESCRIPTION_LENGTH),
    screenshot: experienceScreenshot(experience.imageName),
  };
};
