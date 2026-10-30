// services, features, and other libraries
import { Effect, Layer, Option } from "effect";
import { RpcData } from "./requests";
import { Data } from "@/features/data/services/data";
import { makeRpcHandler } from "@/domain/helpers";

// Every handler resolves its language from the request (see requestPreferredLanguage), so the
// service is acquired once and each handler only picks a method off it
const RpcDataLayer = RpcData.toLayer(
  Effect.map(Data, (data) => ({
    randomPageTitles: () => data.randomPageTitles(Option.none()),
    stablePageTitles: () => data.stablePageTitles(Option.none()),
    experienceList: () => data.experienceList(Option.none()),
    educationList: () => data.educationList(Option.none()),
    experience: ({ slug }) => data.experience(slug, Option.none()),
  }))
).pipe(Layer.provide(Data.layer));

export const handler = makeRpcHandler(RpcData, "/api/rpc/data", RpcDataLayer);
