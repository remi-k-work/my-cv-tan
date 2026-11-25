// services, features, and other libraries
import { Option } from "effect";
import { msg } from "gt-i18n";
import { experiencePath } from "@/features/meta/domain/urls";
import { deadEndEscapeLine } from "./twin-nav";
import { twinBaseFacts } from "./identity";
import { mdBody, mdDocument, mdHeading } from "./format";
import { escapeMd, escapeMdInline } from "./escape";

// types
import type { PreferredLanguage, Translate } from "@/domain/models";
import type { TwinContext } from "./models";

// constants
import { NOT_FOUND_COPY } from "@/features/meta/domain/site";

interface NotFoundMdInput extends TwinContext {
  readonly slug: Option.Option<string>;
}

interface NotFoundCopy {
  readonly address: string;
  readonly missingAddress: string;
  readonly slug: (slug: string) => string;
  readonly missingPath: (path: string) => string;
}

// 404 prose is not dictionary copy: it is resolved from this exhaustive record so a new language
// cannot silently fall through to another language's message
const NOT_FOUND_PROSE = {
  en: {
    address: "No page for this address.",
    missingAddress: "No Markdown document exists for this address.",
    slug: (slug) => `No page for slug "${slug}".`,
    missingPath: (path) => `No Markdown document exists for ${path}.`,
  },
  pl: {
    address: "Nie znaleziono strony dla tego adresu.",
    missingAddress: "Dokument Markdown dla tego adresu nie istnieje.",
    slug: (slug) => `Nie znaleziono strony dla identyfikatora "${slug}".`,
    missingPath: (path) => `Dokument Markdown dla adresu ${path} nie istnieje.`,
  },
} as const satisfies Record<PreferredLanguage, NotFoundCopy>;

const detailOf = (slug: Option.Option<string>) => Option.map(slug, (value) => ({ slug: value, path: escapeMdInline(experiencePath(value)) }));

export const buildNotFoundMd = ({ slug, preferredLanguage, translate }: NotFoundMdInput) => {
  const { title } = NOT_FOUND_COPY[preferredLanguage];
  const copy = NOT_FOUND_PROSE[preferredLanguage];
  const { description, missing } = Option.match(detailOf(slug), {
    onNone: () => ({ description: copy.address, missing: copy.missingAddress }),
    onSome: ({ slug, path }) => ({ description: copy.slug(slug), missing: copy.missingPath(path) }),
  });

  return {
    facts: twinBaseFacts(title, description, preferredLanguage),
    body: mdBody([mdHeading(1, title), missing, deadEndEscapeLine(preferredLanguage, translate)]),
  };
};

export const unavailableMarkdownBody = (translate: Translate) =>
  mdDocument([
    mdHeading(1, translate(msg("Content temporarily unavailable"))),
    escapeMd(translate(msg("The required portfolio content could not be loaded. Please try again shortly."))),
  ]);
