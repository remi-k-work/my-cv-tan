// services, features, and other libraries
import { Effect, Option, Schema, String, pipe } from "effect";
import { PreferredLanguage } from "@/domain";

// Total parsers for .md requests: malformed URLs, hostile percent-encoding and junk
// query parameters resolve to None so handlers answer with a clean Markdown 404
// instead of a 500 HTML error page.

// Decodes a raw query value to a supported language; absent or unknown values become None
const langFrom = (raw: string | null) =>
  pipe(
    Option.fromNullishOr(raw),
    Option.map((value) => value.trim().toLowerCase()),
    Option.flatMap(Schema.decodeUnknownOption(PreferredLanguage))
  );

// Parses the explicit `?lang=` override. None carries both "param absent" and
// "URL unparseable", so callers fall back to cookie / Accept-Language resolution
export const parseLangParam = Effect.fnUntraced(function* (requestUrl: string): Effect.fn.Return<Option.Option<PreferredLanguage>> {
  const raw = yield* Effect.option(Effect.try(() => new URL(requestUrl).searchParams.get("lang")));
  return Option.flatMap(raw, langFrom);
});

// Extract a slug only from a Markdown twin URL; malformed encodings become clean 404 candidates
export const slugFromMdPathname = Effect.fnUntraced(function* (requestUrl: string): Effect.fn.Return<Option.Option<string>> {
  // URL and percent decoding can throw on malformed bot requests; keep both inside Effect.try
  const slug = yield* Effect.option(Effect.try(() => {
    const segment = new URL(requestUrl).pathname.split("/").pop() ?? "";
    if (!String.endsWith(".md")(segment)) return "";
    return decodeURIComponent(segment.slice(0, -".md".length));
  }));

  return pipe(slug, Option.filter(String.isNonEmpty));
});
