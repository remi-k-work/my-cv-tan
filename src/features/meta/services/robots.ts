// services, features, and other libraries
import { Context, Effect, Layer } from "effect";
import { txtResponse } from "./responses";

// constants
import { ROBOTS_TXT_INDEX } from "@/features/meta/domain/discovery";
import { ROBOTS_TXT } from "@/features/meta/domain/robots";

// Encapsulates robots.txt response construction as a service for runtime composition and testability
export class Robots extends Context.Service<
  Robots,
  {
    readonly document: Effect.Effect<Response>;
  }
>()("my-cv-v4-tan/features/meta/services/Robots") {
  static readonly layer = Layer.succeed(
    Robots,
    Robots.of({
      document: Effect.sync(() => txtResponse(ROBOTS_TXT, ROBOTS_TXT_INDEX.url)).pipe(Effect.withSpan("Robots.document")),
    })
  );
}
