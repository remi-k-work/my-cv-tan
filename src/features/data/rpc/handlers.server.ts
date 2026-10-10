// services, features, and other libraries
import { Effect, Layer, Option } from "effect";
import { RpcData } from "./requests";
import { Data } from "@/features/data/services/data";
import { makeRpcHandler } from "@/domain/helpers";

const RpcDataLayer = RpcData.toLayer({
  randomPageTitles: () => Effect.flatMap(Data, (data) => data.randomPageTitles(Option.none())),
  stablePageTitles: () => Effect.flatMap(Data, (data) => data.stablePageTitles(Option.none())),
  experienceList: () => Effect.flatMap(Data, (data) => data.experienceList(Option.none())),
  educationList: () => Effect.flatMap(Data, (data) => data.educationList(Option.none())),
  experience: ({ slug }) => Effect.flatMap(Data, (data) => data.experience(slug, Option.none())),
}).pipe(Layer.provide(Data.layer));

export const handler = makeRpcHandler(RpcData, "/api/rpc/data", RpcDataLayer);
