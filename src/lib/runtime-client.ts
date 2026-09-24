// services, features, and other libraries
import { Layer, Logger, ManagedRuntime } from "effect";
import { Atom, AtomRegistry, Reactivity } from "effect/unstable/reactivity";
import { RpcCaptchaClient } from "@/features/captcha/rpc/client";
import { RpcContactMeClient } from "@/features/contact-me/rpc/client";

// components
import { sharedAtomRegistry } from "@/components/atom-registry-provider";

const sharedMemoMap = Layer.makeMemoMapUnsafe();
const runtimeFactory = Atom.context({ memoMap: sharedMemoMap });

const LoggerLayer = Logger.layer([Logger.consolePretty()]);
const AtomReadyLayer = Layer.mergeAll(Layer.succeed(AtomRegistry.AtomRegistry, sharedAtomRegistry), Reactivity.layer);

const MainLayer = Layer.mergeAll(LoggerLayer, AtomReadyLayer, RpcCaptchaClient.layer, RpcContactMeClient.layer);

export const RuntimeAtom = runtimeFactory(MainLayer);
export const RuntimeClient = ManagedRuntime.make(MainLayer, { memoMap: sharedMemoMap });
