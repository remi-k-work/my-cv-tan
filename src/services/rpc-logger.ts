// services, features, and other libraries
import { Effect, Layer } from "effect";
import { RpcMiddleware } from "effect/rpc";

export class RpcLogger extends RpcMiddleware.Service<RpcLogger>()("RpcLogger") {
  static readonly layer: Layer.Layer<RpcLogger> = Layer.succeed(
    RpcLogger,
    RpcLogger.of((effect, opts) =>
      // Observe failures, logging the full cause without altering the response
      Effect.tapCause(effect, (cause) =>
        Effect.annotateLogs(Effect.logError(`[RPC REQUEST FAILED]: ${opts.rpc._tag}`, cause), {
          "rpc.method": opts.rpc._tag,
          "rpc.clientId": opts.client.id,
        })
      )
    )
  );
}
