// services, features, and other libraries
import { Rpc, RpcGroup } from "effect/unstable/rpc";
import { PreferredLanguage } from "@/domain";
import { RpcLogger } from "@/services/rpc-logger";

export class RpcLang extends RpcGroup.make(
  Rpc.make("update", {
    payload: { preferredLanguage: PreferredLanguage },
  })
).middleware(RpcLogger) {}
