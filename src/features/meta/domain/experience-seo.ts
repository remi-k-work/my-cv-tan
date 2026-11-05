// The published SEO identity of one experience detail page.
// The HTML head, the JSON-LD graph and the Markdown twin all restate the same
// headline, description, URLs and image, so they are derived once here rather
// than independently per surface — the surfaces can then never drift apart.

// services, features, and other libraries
import { Option } from "effect";
import { excerpt, experienceHeadline } from "@/features/experience/domain/helpers";
import { absoluteUrl, experienceMarkdownPath, experiencePath, experienceScreenshot } from "./urls";

// types
import type { ExperienceHeadInput, SocialImageFacts } from "./models";

// constants
import { META_DESCRIPTION_LENGTH } from "./constants";

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
