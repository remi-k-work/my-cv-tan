// services, features, and other libraries
import { HttpApi, HttpApiEndpoint, HttpApiGroup } from "effect/unstable/httpapi";
import { PreferredLanguage } from "@/domain";

class LangApiGroup extends HttpApiGroup.make("Lang")
  .add(HttpApiEndpoint.get("lang", "/lang", { payload: { preferredLanguage: PreferredLanguage } }))
  .prefix("/api") {}

export class LangApi extends HttpApi.make("LangApi").add(LangApiGroup) {}
