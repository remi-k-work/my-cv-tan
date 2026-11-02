// services, features, and other libraries
import { Array, flow, Option, Schema, String, pipe } from "effect";
import { PreferredLanguage } from "@/domain/models";
import { decodeUrlOption } from "@/features/meta/domain/url";

// --- Request parsing for the .md endpoints ---

// Built once at module scope: both query parameter and slug decode through total parsers, so hostile
// input becomes None (a clean 404) rather than a throw from the middle of a document build.
const decodePreferredLanguage = Schema.decodeUnknownOption(PreferredLanguage);
const decodeUrlComponent = Option.liftThrowable(decodeURIComponent);

const langFrom = (raw: string | null) => pipe(Option.fromNullishOr(raw), Option.map(flow(String.trim, String.toLowerCase)), Option.flatMap(decodePreferredLanguage));

// Extracts explicit ?lang= parameter; None triggers header/cookie language negotiation. The
// decoder rejects unknown locales so a crawler can never pin an unsupported language variant.
export const parseLangParam = (url: string) =>
  pipe(
    decodeUrlOption(url),
    Option.map(({ searchParams }) => searchParams.get("lang")),
    Option.flatMap(langFrom)
  );

// Extracts and safely decodes the slug from a .md endpoint.
//
// Each step is ordered so an unmatched or malformed input is data (None) instead of a throw, and the
// raw path — including its literal `.md` extension — is what the first two steps reason about. The
// empty-segment fallback keeps `Array.last` total, the extension check rejects an extensionless path,
// decoding runs only after the extension is gone so a percent-encoded suffix can never masquerade as
// one, and the final emptiness check turns `.md` and `%00.md` into clean misses.
// Malformed percent-encoding becomes None rather than a URIError.
export const slugFromMdPathname = (url: string) =>
  pipe(
    decodeUrlOption(url),
    Option.map(({ pathname }) => pipe(pathname, String.split("/"), Array.last, Option.getOrElse(() => ""))),
    Option.filter(String.endsWith(".md")),
    Option.map(String.slice(0, -".md".length)),
    Option.flatMap(decodeUrlComponent),
    Option.filter(String.isNonEmpty)
  );
