// services, features, and other libraries
import { Schema } from "effect";
import { Rpc, RpcGroup } from "effect/unstable/rpc";
import { EducationList, Experience, ExperienceList, LocalizedContent, PageTitles, PreferredLanguage } from "@/domain";
import { RpcLogger } from "@/services/rpc-logger";

export class RpcData extends RpcGroup.make(
  Rpc.make("preferredLanguage", {
    success: PreferredLanguage,
  }),

  Rpc.make("randomPageTitles", {
    success: Schema.Option(PageTitles),
  }),

  Rpc.make("localizedContent", {
    success: Schema.Option(LocalizedContent),
  }),

  Rpc.make("experienceList", {
    success: Schema.Option(ExperienceList),
  }),

  Rpc.make("educationList", {
    success: Schema.Option(EducationList),
  }),

  Rpc.make("experience", {
    payload: { slug: Experience.fields.slug },
    success: Schema.Option(Experience),
  })
).middleware(RpcLogger) {}
