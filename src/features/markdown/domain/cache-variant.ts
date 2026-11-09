// services, features, and other libraries
import { Array, Option, pipe, String } from "effect";

// constants
import { NEGOTIATION_VARY_TOKENS } from "@/features/meta/domain/constants";

const NEGOTIATION_VARY = new Set(NEGOTIATION_VARY_TOKENS.map((token) => token.toLowerCase()));

// Strips language negotiation tokens from Vary header, returning null if empty
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
