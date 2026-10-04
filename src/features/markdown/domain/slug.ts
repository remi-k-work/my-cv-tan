// services, features, and other libraries
import { Effect, Option, String } from "effect";

// Decodes one pathname segment; malformed percent-encoding (e.g. `/%zz.md`,
// the kind of garbage bots and fuzzers send daily) becomes None instead of throwing,
// so callers emit a clean Markdown 404 rather than a 500 HTML error page.
const safeDecode = (segment: string): Option.Option<string> => Effect.runSync(Effect.option(Effect.try(() => decodeURIComponent(segment))));

// Extracts the content slug from a `.md` request URL (`/my-project.md` -> `my-project`).
// Kept in the domain (rather than the route file) so it stays pure and unit-testable,
// and so the handler never depends on router param plumbing.
export const slugFromMdPathname = (requestUrl: string): Option.Option<string> =>
  Option.fromNullishOr(new URL(requestUrl).pathname.split("/").pop()).pipe(
    Option.flatMap(safeDecode),
    Option.map((segment) => (String.endsWith(".md")(segment) ? segment.slice(0, -".md".length) : segment)),
    Option.filter((slug) => slug.length > 0)
  );
