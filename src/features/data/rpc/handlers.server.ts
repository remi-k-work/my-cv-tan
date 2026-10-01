// services, features, and other libraries
import { Effect, Layer, Option } from "effect";
import { RpcSerialization, RpcServer } from "effect/unstable/rpc";
import { HttpServer, HttpRouter } from "effect/unstable/http";
import { RpcData } from "./requests";
import { Lang } from "@/features/data/services/lang";
import { Data } from "@/features/data/services/data";
import { RpcLoggerLive } from "@/services/rpc-logger";

const RpcDataLayer = RpcData.toLayer({
  preferredLanguage: (_, { headers }) =>
    Effect.gen(function* () {
      const { resolve } = yield* Lang;
      return yield* resolve(Option.some(headers));
    }),

  randomPageTitles: (_, { headers }) =>
    Effect.gen(function* () {
      const { randomPageTitles } = yield* Data;
      return yield* randomPageTitles(Option.none(), Option.some(headers));
    }),

  localizedContent: (_, { headers }) =>
    Effect.gen(function* () {
      const { localizedContent } = yield* Data;
      return yield* localizedContent(Option.none(), Option.some(headers));
    }),

  experienceList: (_, { headers }) =>
    Effect.gen(function* () {
      const { experienceList } = yield* Data;
      return yield* experienceList(Option.none(), Option.some(headers));
    }),

  educationList: (_, { headers }) =>
    Effect.gen(function* () {
      const { educationList } = yield* Data;
      return yield* educationList(Option.none(), Option.some(headers));
    }),

  experience: ({ slug }, { headers }) =>
    Effect.gen(function* () {
      const { experience } = yield* Data;
      return yield* experience(slug, Option.none(), Option.some(headers));
    }),
}).pipe(Layer.provide([Lang.layer, Data.layer]));

const RpcLayer = RpcServer.layerHttp({
  group: RpcData,
  path: "/api/rpc/data",
  protocol: "http",
  disableFatalDefects: true,
  disableTracing: true,
}).pipe(Layer.provide(Layer.mergeAll(RpcDataLayer, RpcSerialization.layerSchemaBinary(), HttpServer.layerServices, RpcLoggerLive)));

export const handler = HttpRouter.toWebHandler(RpcLayer, { disableLogger: true });
