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
// "URL unparseable", so callers fall back to cookie / Accept-Language resolution.
export const parseLangParam = Effect.fnUntraced(function* (requestUrl: string): Effect.fn.Return<Option.Option<PreferredLanguage>> {
  const raw = yield* Effect.option(Effect.try(() => new URL(requestUrl).searchParams.get("lang")));
  return Option.flatMap(raw, langFrom);
});

// Extracts the content slug from a `.md` request URL (`/my-project.md` -> `my-project`).
// Kept in the domain (rather than the route file) so it stays pure and unit-testable,
// and so the handler never depends on router param plumbing.
export const slugFromMdPathname = Effect.fnUntraced(function* (requestUrl: string): Effect.fn.Return<Option.Option<string>> {
  // decodeURIComponent throws URIError on malformed escapes (`/%zz.md`, the garbage
  // bots send daily) — the only throwable step, kept inside Effect.try
  const slug = yield* Effect.option(
    Effect.try((): Option.Option<string> => {
      const segment = Option.fromNullishOr(new URL(requestUrl).pathname.split("/").pop());
      return pipe(
        segment,
        Option.map((value) => decodeURIComponent(value)),
        Option.map((value) => (String.endsWith(".md")(value) ? value.slice(0, -".md".length) : value)),
        Option.filter((value) => value.length > 0)
      );
    })
  );
  return Option.flatten(slug);
});
