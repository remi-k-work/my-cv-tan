// tanstack
import { getCookie, getRequestHeader } from "@tanstack/react-start/server";

// services, features, and other libraries
import { Effect, Option } from "effect";

export const getCookieEffect = Effect.fn("getCookieEffect")((name: string) => Effect.sync(() => getCookie(name)), Effect.map(Option.fromNullishOr));

export const getRequestHeaderEffect = Effect.fn("getRequestHeaderEffect")(
  (name: string) => Effect.sync(() => getRequestHeader(name)),
  Effect.map(Option.fromNullishOr)
);
