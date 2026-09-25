import "@tanstack/react-start/server-only";

// services, features, and other libraries
import { Effect, Layer, Schema } from "effect";
import { RpcSerialization, RpcServer } from "effect/unstable/rpc";
import { HttpServer, HttpRouter } from "effect/unstable/http";
import { RpcLang } from "./requests";
import { Lang } from "@/features/lang/services/lang";
import { RpcLoggerLive } from "@/services/rpc-logger";
import { EducationList, ExperienceList, LocalizedContent, matchPreferredLanguage, PageTitlesList } from "@/domain";

// assets
import pageTitlesEn from "@/assets/data/en/page-titles.json";
import pageTitlesPl from "@/assets/data/pl/page-titles.json";
import localizedContentEn from "@/assets/data/en/localized-content.json";
import localizedContentPl from "@/assets/data/pl/localized-content.json";
import experienceEn from "@/assets/data/en/experience.json";
import experiencePl from "@/assets/data/pl/experience.json";
import educationEn from "@/assets/data/en/education.json";
import educationPl from "@/assets/data/pl/education.json";

const RpcLangLayer = RpcLang.toLayer({
  preferredLanguage: (_, { headers }) =>
    Effect.gen(function* () {
      const { resolve } = yield* Lang;
      return yield* resolve(headers);
    }),

  pageTitlesList: (_, { headers }) =>
    Effect.gen(function* () {
      const { resolve } = yield* Lang;
      const preferredLanguage = yield* resolve(headers);
      return Schema.decodeUnknownOption(PageTitlesList)(matchPreferredLanguage(preferredLanguage, pageTitlesEn, pageTitlesPl));
    }),

  localizedContent: (_, { headers }) =>
    Effect.gen(function* () {
      const { resolve } = yield* Lang;
      const preferredLanguage = yield* resolve(headers);
      return Schema.decodeOption(LocalizedContent)(matchPreferredLanguage(preferredLanguage, localizedContentEn, localizedContentPl));
    }),

  experienceList: (_, { headers }) =>
    Effect.gen(function* () {
      const { resolve } = yield* Lang;
      const preferredLanguage = yield* resolve(headers);
      return Schema.decodeUnknownOption(ExperienceList)(matchPreferredLanguage(preferredLanguage, experienceEn, experiencePl));
    }),

  educationList: (_, { headers }) =>
    Effect.gen(function* () {
      const { resolve } = yield* Lang;
      const preferredLanguage = yield* resolve(headers);
      return Schema.decodeUnknownOption(EducationList)(matchPreferredLanguage(preferredLanguage, educationEn, educationPl));
    }),
}).pipe(Layer.provide(Lang.layer));

const RpcLayer = RpcServer.layerHttp({
  group: RpcLang,
  path: "/api/rpc/lang",
  protocol: "http",
  disableFatalDefects: true,
  disableTracing: true,
}).pipe(Layer.provide(Layer.mergeAll(RpcLangLayer, RpcSerialization.layerSchemaBinary(), HttpServer.layerServices, RpcLoggerLive)));

export const handler = HttpRouter.toWebHandler(RpcLayer, { disableLogger: true });
