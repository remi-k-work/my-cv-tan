// services, features, and other libraries
import { Array, flow, Option, Schema, String, pipe } from "effect";
import { PreferredLanguage } from "@/domain/models";
import { decodeUrlOption } from "@/features/meta/domain/url";

// Decodes query parameter into supported language variant; case-insensitive and trimmed
// Hoisted so parsing a request reuses one language decoder
const decodePreferredLanguage = Schema.decodeUnknownOption(PreferredLanguage);

// Hoisted so decoding a slug reuses one total percent-decoder; invalid escapes become None
const decodeUrlComponent = Option.liftThrowable(decodeURIComponent);

const langFrom = (raw: string | null) =>
  pipe(Option.fromNullishOr(raw), Option.map(flow(String.trim, String.toLowerCase)), Option.flatMap(decodePreferredLanguage));

// Extracts explicit ?lang= parameter; None triggers header/cookie language negotiation
export const parseLangParam = (url: string) =>
  pipe(
    decodeUrlOption(url),
    Option.map(({ searchParams }) => searchParams.get("lang")),
    Option.flatMap(langFrom)
  );

// Extracts and safely decodes URL slug from .md endpoints; invalid percent-encoding becomes None (clean 404)
export const slugFromMdPathname = (url: string) =>
  pipe(
    decodeUrlOption(url),
    Option.map(({ pathname }) =>
      pipe(
        pathname,
        String.split("/"),
        Array.last,
        Option.getOrElse(() => "")
      )
    ),
    Option.filter(String.endsWith(".md")),
    Option.map(String.slice(0, -".md".length)),
    Option.flatMap(decodeUrlComponent),
    Option.filter(String.isNonEmpty)
  );
