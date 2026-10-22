// services, features, and other libraries
import { Array, flow, Option, Schema, String, pipe } from "effect";
import { PreferredLanguage } from "@/domain/models";

// Safely constructs URL object without throwing; malformed strings evaluate to None
const requestUrl = Option.liftThrowable((url: string) => new URL(url));

// Decodes query parameter into supported language variant; case-insensitive and trimmed
const langFrom = (raw: string | null) =>
  pipe(Option.fromNullishOr(raw), Option.map(flow(String.trim, String.toLowerCase)), Option.flatMap(Schema.decodeUnknownOption(PreferredLanguage)));

// Extracts explicit ?lang= parameter; None triggers header/cookie language negotiation
export const parseLangParam = (url: string) =>
  pipe(
    requestUrl(url),
    Option.map(({ searchParams }) => searchParams.get("lang")),
    Option.flatMap(langFrom)
  );

// Extracts and safely decodes URL slug from .md endpoints; invalid percent-encoding becomes None (clean 404)
export const slugFromMdPathname = (url: string) =>
  pipe(
    requestUrl(url),
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
    Option.flatMap(Option.liftThrowable(decodeURIComponent)),
    Option.filter(String.isNonEmpty)
  );
