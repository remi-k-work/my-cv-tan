// Request parameter and URL parsing for Markdown endpoints.

// services, features, and other libraries
import { Array, flow, Option, Schema, String, pipe } from "effect";
import { PreferredLanguage } from "@/domain/models";
import { decodeUrlOption } from "@/features/meta/domain/url";

const decodePreferredLanguage = Schema.decodeUnknownOption(PreferredLanguage);
const decodeUrlComponent = Option.liftThrowable(decodeURIComponent);

const langFrom = (raw: string | null) =>
  pipe(Option.fromNullishOr(raw), Option.map(flow(String.trim, String.toLowerCase)), Option.flatMap(decodePreferredLanguage));

// Extracts and validates ?lang= parameter from request URL.
export const parseLangParam = (url: string) =>
  pipe(
    decodeUrlOption(url),
    Option.map(({ searchParams }) => searchParams.get("lang")),
    Option.flatMap(langFrom)
  );

// Extracts and safely percent-decodes experience slug from a /{slug}.md URL.
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
