// Request parameter and URL parsing for Markdown endpoints.

// services, features, and other libraries
import { flow, Option, Schema, String, pipe } from "effect";
import { PreferredLanguage } from "@/domain/models";
import { decodeUrlOption } from "@/features/meta/domain/url";

const decodePreferredLanguage = Schema.decodeUnknownOption(PreferredLanguage);
const decodeUrlComponent = Option.liftThrowable(decodeURIComponent);

// Extracts and validates ?lang= parameter from request URL.
export const parseLangParam = (url: string) =>
  pipe(
    decodeUrlOption(url),
    Option.flatMap(({ searchParams }) => Option.fromNullishOr(searchParams.get("lang"))),
    Option.map(flow(String.trim, String.toLowerCase)),
    Option.flatMap(decodePreferredLanguage)
  );

// Extracts and safely percent-decodes experience slug from a /{slug}.md URL.
export const slugFromMdPathname = (url: string) =>
  pipe(
    decodeUrlOption(url),
    Option.map(({ pathname }) => pathname.slice(pathname.lastIndexOf("/") + 1)),
    Option.filter((segment) => segment.endsWith(".md")),
    Option.map((segment) => segment.slice(0, -".md".length)),
    Option.flatMap(decodeUrlComponent),
    Option.filter(String.isNonEmpty)
  );
