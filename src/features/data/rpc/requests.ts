// services, features, and other libraries
import { Schema } from "effect";
import { Rpc, RpcGroup } from "effect/rpc";
import { Experience, ExperienceList } from "@/features/experience/domain/models";
import { EducationList, PageHighlights } from "@/domain/models";
import { RpcLogger } from "@/services/rpc-logger";

export class RpcData extends RpcGroup.make(
  Rpc.make("randomPageHighlights", {
    success: Schema.Option(PageHighlights),
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
