// The published SEO identity of one experience detail page.
// The HTML head, the JSON-LD graph and the Markdown twin all restate the same
// headline, description, URLs and image, so they are derived once here rather
// than independently per surface — the surfaces can then never drift apart.

// services, features, and other libraries
import { Option, String } from "effect";
import { excerpt, experienceHeadline } from "@/features/experience/domain/helpers";
import { absoluteUrl, experienceMarkdownPath, experiencePath } from "./urls";

// constants
import { META_DESCRIPTION_LENGTH } from "./constants";
import { SCREENSHOT_HEIGHT, SCREENSHOT_WIDTH } from "@/features/experience/domain/constants";

// types
import type { ExperienceHeadInput, SocialImageFacts } from "./models";

// Resolves screenshot dimensions and absolute URL when an image name is provided.
export const experienceScreenshot = (imageName: string): Option.Option<SocialImageFacts> => {
  const name = String.trim(imageName);

  return String.isNonEmpty(name)
    ? Option.some({
        src: absoluteUrl(`/images/${encodeURIComponent(name)}-a.webp`),
        mime: "image/webp",
        width: SCREENSHOT_WIDTH,
        height: SCREENSHOT_HEIGHT,
      })
    : Option.none();
};

export interface ExperienceSeo extends ExperienceHeadInput {
  // Canonical HTML path and twin route for the page.
  readonly path: string;
  readonly canonical: string;
  readonly markdownPath: string;
  // Localized snippet copy shared by the head, the graph and the twin.
  readonly headline: string;
  readonly description: string;
  // Verified screenshot facts, or none when the page publishes no image.
  readonly screenshot: Option.Option<SocialImageFacts>;
}

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
