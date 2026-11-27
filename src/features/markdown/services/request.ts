// services, features, and other libraries
import { Option, Predicate, String, flow, pipe } from "effect";
import { decodePreferredLanguage } from "@/domain/models";
import { decodeExperienceSlug, decodeUrlOption } from "@/features/meta/domain/urls";

// constants
import { LANG_PARAM } from "@/domain/site";

// Parses and validates the ?lang= query parameter from a request URL
export const parseLangParam = (url: string) =>
  pipe(
    decodeUrlOption(url),
    Option.flatMapNullishOr(({ searchParams }) => searchParams.get(LANG_PARAM)),
    Option.map(flow(String.trim, String.toLowerCase)),
    Option.flatMap(decodePreferredLanguage)
  );

// Extracts the experience slug from a markdown route pathname (e.g., /my-experience.md -> "my-experience")
export const slugFromMdPathname = (url: string) =>
  pipe(
    decodeUrlOption(url),
    Option.map(({ pathname }) => pipe(pathname, String.slice(1))),
    // A markdown twin lives at a single top-level segment: a nested path is not a twin route
    Option.filter(Predicate.and(Predicate.not(String.includes("/")), String.endsWith(".md"))),
    Option.map(String.slice(0, -".md".length)),
    // The shared codec is the exact inverse of experiencePath, so encoded slugs round-trip
    Option.flatMap(decodeExperienceSlug)
  );

// Names the failing document in a log line without trusting the URL to parse
export const documentName = (url: string) =>
  pipe(
    decodeUrlOption(url),
    Option.map(({ pathname }) => pathname),
    Option.getOrElse(() => url)
  );
