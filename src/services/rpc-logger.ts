// services, features, and other libraries
import { Effect, Exit, Layer } from "effect";
import { RpcMiddleware } from "effect/rpc";

export class RpcLogger extends RpcMiddleware.Service<RpcLogger>()("RpcLogger") {}

export const RpcLoggerLive: Layer.Layer<RpcLogger> = Layer.succeed(
  RpcLogger,
  RpcLogger.of((effect, opts) =>
    // Observe the handler's outcome, logging failures without altering the response
    Effect.onExit(effect, (exit) =>
      Exit.isSuccess(exit)
        ? Effect.void
        : Effect.annotateLogs(Effect.logError(`[RPC REQUEST FAILED]: ${opts.rpc._tag}`, exit.cause), {
            "rpc.method": opts.rpc._tag,
            "rpc.clientId": opts.client.id,
          })
    )
  )
);
