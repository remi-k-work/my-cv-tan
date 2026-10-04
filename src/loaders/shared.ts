// services, features, and other libraries
import { Effect } from "effect";
import { RuntimeClient } from "@/lib/runtime-client";
import { RpcDataClient } from "@/features/data/rpc/client";

// Runs a client loader against the data RPC client, logging failures before rejecting
export const clientLoader = <A, E>(use: (client: RpcDataClient["Service"]) => Effect.Effect<A, E>) =>
  RuntimeClient.runPromise(
    Effect.gen(function* () {
      const client = yield* RpcDataClient;
      return yield* use(client);
    }).pipe(Effect.tapError(Effect.logError))
  );
