// services, features, and other libraries
import { Schema } from "effect";
import { Rpc, RpcGroup } from "effect/unstable/rpc";
import { CaptchaInputField } from "@/domain";

export class RpcMain extends RpcGroup.make(
  Rpc.make("isCaptchaValid", {
    payload: { captchaInput: CaptchaInputField().schema },
    success: Schema.Boolean,
  })
) {}
