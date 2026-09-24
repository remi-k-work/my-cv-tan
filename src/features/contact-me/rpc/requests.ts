// services, features, and other libraries
import { Rpc, RpcGroup } from "effect/unstable/rpc";
import { SendError } from "@/domain";
import { EmailField, MessageField, NameField, SubjectField } from "@/features/contact-me/domain";
import { RpcLogger } from "@/services/rpc-logger";

export class RpcContactMe extends RpcGroup.make(
  Rpc.make("contactForm", {
    payload: {
      name: NameField().schema,
      email: EmailField().schema,
      subject: SubjectField().schema,
      message: MessageField().schema,
    },
    error: SendError,
  })
).middleware(RpcLogger) {}
