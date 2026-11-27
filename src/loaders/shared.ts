// services, features, and other libraries
import { Effect } from "effect";
import { RpcClientError } from "effect/rpc";
import { RuntimeClient } from "@/lib/runtime-client";
import { RpcDataClient } from "@/features/data/rpc/client";

// types
import type { PageData } from "./page-data";

// Runs a client loader against the data RPC client, logging failures before rejecting
export const clientLoader = <A, E>(use: (source: PageData<RpcClientError.RpcClientError>) => Effect.Effect<A, E>, signal?: AbortSignal) =>
  RuntimeClient.runPromise(
    Effect.flatMap(RpcDataClient, (client) =>
      // Effects are lazy, so the requests below are only described here, not fired
      use({
        randomPageHighlights: client.randomPageHighlights(),
        stablePageTitles: client.stablePageTitles(),
        experienceList: client.experienceList(),
        educationList: client.educationList(),
      })
    ).pipe(Effect.tapError(Effect.logError)),
    { signal }
  );
