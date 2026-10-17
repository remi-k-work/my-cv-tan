// services, features, and other libraries
import { Schema } from "effect";
import { Rpc, RpcGroup } from "effect/rpc";
import { CaptchaError } from "@/domain/errors";
import { CaptchaInputField } from "@/features/captcha/domain/fields";
import { RpcLogger } from "@/services/rpc-logger";

export class RpcCaptcha extends RpcGroup.make(
  Rpc.make("isCaptchaValid", {
    payload: { captchaInput: CaptchaInputField.schema },
    success: Schema.Boolean,
    error: CaptchaError,
  })
).middleware(RpcLogger) {}
