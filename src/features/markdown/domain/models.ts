// types
import type { PreferredLanguage, Translate } from "@/domain/models";

// A Markdown twin consists of structured frontmatter facts and a markdown body
export interface MarkdownTwin {
  readonly facts: Readonly<Record<string, string>>;
  readonly body: string;
}

// Everything a twin builder needs to resolve copy for one reader
export interface TwinContext {
  readonly preferredLanguage: PreferredLanguage;
  readonly translate: Translate;
  // Aggregated documents own discovery links, so embedded twins omit their repeated navigation
  readonly includeNavigation?: boolean;
}
