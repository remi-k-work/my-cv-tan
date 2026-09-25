// services, features, and other libraries
import { Schema } from "effect";
import { Rpc, RpcGroup } from "effect/unstable/rpc";
import { EducationList, ExperienceList, LocalizedContent, PageTitlesList, PreferredLanguage } from "@/domain";
import { LangError } from "@/domain";
import { RpcLogger } from "@/services/rpc-logger";

export class RpcData extends RpcGroup.make(
  Rpc.make("preferredLanguage", {
    success: PreferredLanguage,
    error: LangError,
  }),

  Rpc.make("pageTitlesList", {
    success: Schema.Option(PageTitlesList),
    error: LangError,
  }),

  Rpc.make("localizedContent", {
    success: Schema.Option(LocalizedContent),
    error: LangError,
  }),

  Rpc.make("experienceList", {
    success: Schema.Option(ExperienceList),
    error: LangError,
  }),

  Rpc.make("educationList", {
    success: Schema.Option(EducationList),
    error: LangError,
  })
).middleware(RpcLogger) {}
