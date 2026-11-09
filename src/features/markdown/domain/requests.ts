// services, features, and other libraries
import { flow, Option, Schema, String, pipe } from "effect";
import { PreferredLanguage } from "@/domain/models";
import { decodeUrlOption } from "@/features/meta/domain/urls";

// constants
import { LANG_PARAM } from "@/features/meta/domain/constants";

const decodePreferredLanguage = Schema.decodeUnknownOption(PreferredLanguage);
const decodeUrlComponent = Option.liftThrowable(decodeURIComponent);

// Parses and validates the ?lang= query parameter from a request URL
export const parseLangParam = (url: string) =>
  pipe(
    decodeUrlOption(url),
    Option.flatMap(({ searchParams }) => Option.fromNullishOr(searchParams.get(LANG_PARAM))),
    Option.map(flow(String.trim, String.toLowerCase)),
    Option.flatMap(decodePreferredLanguage)
  );

// Extracts the experience slug from a markdown route pathname (e.g., /my-experience.md -> "my-experience")
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
