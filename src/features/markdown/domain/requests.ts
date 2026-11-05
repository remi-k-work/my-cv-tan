// Markdown request parsing: the ?lang= override and the twin slug, both pure URL math.
// These read the shape of a Markdown request, so they live with the Markdown feature rather than
// in the site-wide URL addressing module the HTML heads and discovery documents share.

// services, features, and other libraries
import { flow, Option, Schema, String, pipe } from "effect";
import { PreferredLanguage } from "@/domain/models";
import { decodeUrlOption } from "@/features/meta/domain/urls";

const decodePreferredLanguage = Schema.decodeUnknownOption(PreferredLanguage);
const decodeUrlComponent = Option.liftThrowable(decodeURIComponent);

// Extracts the ?lang= override from a request URL, validating it against supported languages.
export const parseLangParam = (url: string) =>
  pipe(
    decodeUrlOption(url),
    Option.flatMap(({ searchParams }) => Option.fromNullishOr(searchParams.get("lang"))),
    Option.map(flow(String.trim, String.toLowerCase)),
    Option.flatMap(decodePreferredLanguage)
  );

// Extracts a markdown twin slug from a request URL pathname (e.g. /my-page.md -> "my-page").
// The twin route is one path segment, so literal nested paths and extensionless paths return
// None; an encoded slash inside the segment still decodes into the slug.
export const slugFromMdPathname = (url: string) =>
  pipe(
    decodeUrlOption(url),
    Option.map(({ pathname }) => pathname.slice(1)),
    Option.filter((path) => !path.includes("/")),
    Option.filter((segment) => segment.endsWith(".md")),
    Option.map((segment) => segment.slice(0, -".md".length)),
    Option.flatMap(decodeUrlComponent),
    Option.filter(String.isNonEmpty)
  );
