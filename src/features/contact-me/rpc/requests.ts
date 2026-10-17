// services, features, and other libraries
import { Schema } from "effect";
import { Rpc, RpcGroup } from "effect/rpc";
import { CaptchaError, SendError } from "@/domain/errors";
import { EmailField, MessageField, NameField, SubjectField } from "@/features/contact-me/domain/fields";
import { CaptchaInputField } from "@/features/captcha/domain/fields";
import { RpcLogger } from "@/services/rpc-logger";

export class RpcContactMe extends RpcGroup.make(
  Rpc.make("contactForm", {
    payload: {
      name: NameField().schema,
      email: EmailField().schema,
      subject: SubjectField.schema,
      message: MessageField.schema,
      // Carried in the payload so the handler can verify the captcha itself: the RPC is a public
      // endpoint, so a gate that only lives in the client form refine can be bypassed by a script
      captchaInput: CaptchaInputField.schema,
    },
    // A failed captcha surfaces as its own tagged error next to send failures
    error: Schema.Union([SendError, CaptchaError]),
  })
).middleware(RpcLogger) {}
