// services, features, and other libraries
import { Schema } from "effect";
import { Rpc, RpcGroup } from "effect/rpc";
import { Experience, ExperienceList } from "@/features/experience/domain";
import { EducationList } from "@/features/education/domain";
import { PageTitles } from "@/domain";
import { RpcLogger } from "@/services/rpc-logger";

export class RpcData extends RpcGroup.make(
  Rpc.make("randomPageTitles", {
    success: Schema.Option(PageTitles),
  }),

  Rpc.make("stablePageTitles", {
    success: Schema.Option(PageTitles),
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
