// services, features, and other libraries
import { Option, Schema, String, pipe } from "effect";
import { PreferredLanguage } from "@/domain";

// Parse an absolute request URL without throwing; unparseable input becomes None
const requestUrl = Option.liftThrowable((url: string) => new URL(url));

// Decodes a raw query value to a supported language; absent or unknown values become None
const langFrom = (raw: string | null) =>
  pipe(
    Option.fromNullishOr(raw),
    Option.map((value) => value.trim().toLowerCase()),
    Option.flatMap(Schema.decodeUnknownOption(PreferredLanguage))
  );

// Parses the explicit `?lang=` override. None carries both "param absent" and
// "URL unparseable", so callers fall back to cookie / Accept-Language resolution
export const parseLangParam = (url: string) =>
  pipe(
    requestUrl(url),
    Option.map(({ searchParams }) => searchParams.get("lang")),
    Option.flatMap(langFrom)
  );

// Extract a slug only from a Markdown twin URL; malformed encodings become clean 404 candidates
export const slugFromMdPathname = (url: string) =>
  pipe(
    requestUrl(url),
    Option.map(({ pathname }) => pathname.split("/").pop() ?? ""),
    Option.filter(String.endsWith(".md")),
    Option.map(String.slice(0, -".md".length)),
    // decodeURIComponent throws on malformed percent-encoding; lifted so it becomes None
    Option.flatMap(Option.liftThrowable(decodeURIComponent)),
    Option.filter(String.isNonEmpty)
  );
