// services, features, and other libraries
import { Schema } from "effect";
import { Rpc, RpcGroup } from "effect/unstable/rpc";
import { EducationList, ExperienceList, LocalizedContent, PageTitlesList, PreferredLanguage } from "@/domain";
import { RpcLogger } from "@/services/rpc-logger";

export class RpcData extends RpcGroup.make(
  Rpc.make("preferredLanguage", {
    success: PreferredLanguage,
  }),

  Rpc.make("pageTitlesList", {
    success: Schema.Option(PageTitlesList),
  }),

  Rpc.make("localizedContent", {
    success: Schema.Option(LocalizedContent),
  }),

  Rpc.make("experienceList", {
    success: Schema.Option(ExperienceList),
  }),

  Rpc.make("educationList", {
    success: Schema.Option(EducationList),
  })
).middleware(RpcLogger) {}
