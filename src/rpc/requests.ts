// services, features, and other libraries
import { Schema } from "effect";
import { Rpc, RpcGroup } from "effect/unstable/rpc";
import { PreferredLanguage, SendError } from "@/domain";
import { CaptchaInputField, EmailField, MessageField, NameField, SubjectField } from "@/features/contact-me/domain";
import { RpcLogger } from "@/services/rpc-logger";

export class RpcMain extends RpcGroup.make(
  Rpc.make("isCaptchaValid", {
    payload: { captchaInput: CaptchaInputField().schema },
    success: Schema.Boolean,
  }),

  Rpc.make("contactForm", {
    payload: {
      preferredLanguage: PreferredLanguage,
      name: NameField().schema,
      email: EmailField().schema,
      subject: SubjectField().schema,
      message: MessageField().schema,
    },
    error: SendError,
  })
).middleware(RpcLogger) {}
