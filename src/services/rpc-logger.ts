// services, features, and other libraries
import { Effect, Exit, Layer } from "effect";
import { RpcMiddleware } from "effect/unstable/rpc";

export class RpcLogger extends RpcMiddleware.Service<RpcLogger>()("RpcLogger") {}

export const RpcLoggerLive: Layer.Layer<RpcLogger> = Layer.succeed(
  RpcLogger,
  RpcLogger.of((effect, opts) =>
    Effect.flatMap(Effect.exit(effect), (exit) =>
      Exit.match(exit, {
        onSuccess: () => exit,
        onFailure: (cause) =>
          Effect.andThen(
            Effect.annotateLogs(Effect.logError(`RPC request failed: ${opts.rpc._tag}`, cause), {
              "rpc.method": opts.rpc._tag,
              "rpc.clientId": opts.client.id,
            }),
            exit
          ),
      })
    )
  )
);
