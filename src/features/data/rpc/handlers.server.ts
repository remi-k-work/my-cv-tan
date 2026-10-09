// services, features, and other libraries
import { Effect, Layer, Option } from "effect";
import { RpcSerialization, RpcServer } from "effect/rpc";
import { HttpServer, HttpRouter } from "effect/http";
import { RpcData } from "./requests";
import { Data } from "@/features/data/services/data";
import { RpcLoggerLive } from "@/services/rpc-logger";

const RpcDataLayer = RpcData.toLayer({
  randomPageTitles: () =>
    Effect.gen(function* () {
      const { randomPageTitles } = yield* Data;
      return yield* randomPageTitles(Option.none());
    }),

  stablePageTitles: () =>
    Effect.gen(function* () {
      const { stablePageTitles } = yield* Data;
      return yield* stablePageTitles(Option.none());
    }),

  experienceList: () =>
    Effect.gen(function* () {
      const { experienceList } = yield* Data;
      return yield* experienceList(Option.none());
    }),

  educationList: () =>
    Effect.gen(function* () {
      const { educationList } = yield* Data;
      return yield* educationList(Option.none());
    }),

  experience: ({ slug }) =>
    Effect.gen(function* () {
      const { experience } = yield* Data;
      return yield* experience(slug, Option.none());
    }),
}).pipe(Layer.provide(Data.layer));

const RpcLayer = RpcServer.layerHttp({
  group: RpcData,
  path: "/api/rpc/data",
  protocol: "http",
  disableFatalDefects: true,
  disableTracing: true,
}).pipe(Layer.provide(Layer.mergeAll(RpcDataLayer, RpcSerialization.layerSchemaBinary(), HttpServer.layerServices, RpcLoggerLive)));

export const handler = HttpRouter.toWebHandler(RpcLayer, { disableLogger: true });
