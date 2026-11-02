// services, features, and other libraries
import { msg } from "gt-tanstack-start";
import { Option } from "effect";
import { matchPreferredLanguage } from "@/domain/helpers";
import { experiencePath } from "@/features/meta/domain/url";
import { deadEndEscapeLine } from "./document-graph";
import { frontmatter, mdDocument, mdHeading } from "./blocks";
import { escapeMdInline } from "./text";

// types
import type { BuildNotFoundMdInput } from "./models";

// constants
import { SITE_NAME } from "@/features/meta/domain/constants";

// --- The shared Markdown 404 ---
// It is the one not-found document the whole .md namespace answers with, whether the address carried
// no decodable slug at all or named a slug no twin serves.

// Both quoted facts of the 404 come from a single Option, so an address either carries its escaped
// slug and path or neither: an AI citation must never read back an identifier that was never requested.
// Escaping is applied here so the slug can never inject Markdown structure into the 404 document.
const detailOf = (slug: Option.Option<string>) => Option.map(slug, (value) => ({ slug: escapeMdInline(value), path: escapeMdInline(experiencePath(value)) }));

// Explicit, parseable not-found document rather than an HTML error page: AI fetchers get an honest
// answer and stay on the llms.txt graph of valid documents
export const buildNotFoundMd = ({ slug, preferredLanguage, translate }: BuildNotFoundMdInput) => {
  const title = translate(msg("Not Found"));
  const detail = detailOf(slug);

  const description = Option.match(detail, {
    onNone: () => matchPreferredLanguage(preferredLanguage, "No page for this address.", "Nie znaleziono strony dla tego adresu."),
    onSome: ({ slug }) => matchPreferredLanguage(preferredLanguage, `No page for slug "${slug}".`, `Nie znaleziono strony dla identyfikatora "${slug}".`),
  });

  const missing = Option.match(detail, {
    onNone: () => matchPreferredLanguage(preferredLanguage, "No Markdown document exists for this address.", "Dokument Markdown dla tego adresu nie istnieje."),
    onSome: ({ path }) => matchPreferredLanguage(preferredLanguage, `No Markdown document exists for ${path}.`, `Dokument Markdown dla adresu ${path} nie istnieje.`),
  });

  return mdDocument([
    // Same identity fields a found twin declares (see twinIdentity), minus the ones a dead slug has
    // no honest value for: no canonical to cite and no content type to classify
    frontmatter({ title, description, lang: preferredLanguage, author: SITE_NAME }),
    mdHeading(1, title),
    missing,
    deadEndEscapeLine(preferredLanguage, translate),
  ]);
};
