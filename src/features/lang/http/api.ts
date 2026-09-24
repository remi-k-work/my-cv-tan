// services, features, and other libraries
import { Schema } from "effect";
import { HttpApi, HttpApiEndpoint, HttpApiGroup } from "effect/unstable/httpapi";
import { PreferredLanguage } from "@/domain";

class LangApiGroup extends HttpApiGroup.make("Lang")
  .add(HttpApiEndpoint.post("lang", "/lang", { payload: Schema.Struct({ preferredLanguage: PreferredLanguage }) }))
  .prefix("/api") {}

export class LangApi extends HttpApi.make("LangApi").add(LangApiGroup) {}
