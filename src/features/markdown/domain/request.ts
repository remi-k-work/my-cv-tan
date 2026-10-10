// services, features, and other libraries
import { Option, Schema, String, pipe } from "effect";
import { PreferredLanguage } from "@/domain";

// Decodes a raw query value to a supported language; absent or unknown values become None
const langFrom = (raw: string | null) =>
  pipe(
    Option.fromNullishOr(raw),
    Option.map((value) => value.trim().toLowerCase()),
    Option.flatMap(Schema.decodeUnknownOption(PreferredLanguage))
  );

// Parses the explicit `?lang=` override. None carries both "param absent" and
// "URL unparseable", so callers fall back to cookie / Accept-Language resolution
export const parseLangParam = (requestUrl: string): Option.Option<PreferredLanguage> =>
  pipe(Option.liftThrowable(() => new URL(requestUrl).searchParams.get("lang"))(), Option.flatMap(langFrom));

// Extract a slug only from a Markdown twin URL; malformed encodings become clean 404 candidates
export const slugFromMdPathname = (requestUrl: string) =>
  pipe(
    Option.liftThrowable(() => {
      const segment = new URL(requestUrl).pathname.split("/").pop() ?? "";
      if (!String.endsWith(".md")(segment)) return "";
      return decodeURIComponent(segment.slice(0, -".md".length));
    })(),
    Option.filter(String.isNonEmpty)
  );
