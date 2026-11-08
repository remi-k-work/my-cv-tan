// Cache-variant header math for language-pinned Markdown twins. A `?lang=` pin selects the
// document from the URL alone, so the inputs the site negotiates on stop being variants; every
// other token the runtime put in Vary (for example Accept-Encoding for compression) still applies.

// services, features, and other libraries
import { Array, Option, pipe, String } from "effect";

// meta (shared)
import { NEGOTIATION_VARY_TOKENS } from "@/features/meta/domain/languages";

// The negotiation tokens are single-sourced with documentHeaders, so this strip removes exactly the
// Vary inputs the twin advertised — never a token a shared cache still needs, never one it doesn't.
const NEGOTIATION_VARY = new Set(NEGOTIATION_VARY_TOKENS.map((token) => token.toLowerCase()));

// Removes the negotiation tokens from a Vary header value, returning null when none remain so the
// caller can drop the header entirely. An absent header stays absent.
export const withoutNegotiationVary = (vary: string | null) =>
  pipe(
    Option.fromNullishOr(vary),
    Option.map((v) =>
      pipe(
        String.split(v, ","),
        Array.map(String.trim),
        Array.filter((token) => String.isNonEmpty(token) && !NEGOTIATION_VARY.has(token.toLowerCase()))
      )
    ),
    Option.filter((tokens) => tokens.length > 0),
    Option.map(Array.join(", ")),
    Option.getOrNull
  );
