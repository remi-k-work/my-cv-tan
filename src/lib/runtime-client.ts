// services, features, and other libraries
import { Layer, Logger, ManagedRuntime } from "effect";
import { Atom, AtomRegistry, Reactivity } from "effect/reactivity";
import { RpcCaptchaClient } from "@/features/captcha/rpc/client";
import { RpcContactMeClient } from "@/features/contact-me/rpc/client";
import { RpcDataClient } from "@/features/data/rpc/client";
import { Typewriter } from "@/features/typewriter/services/typewriter";

// components
import { sharedAtomRegistry } from "@/ui/atom-registry-provider";

const LoggerLayer = Logger.layer([Logger.consolePretty()]);
const AtomReadyLayer = Layer.mergeAll(Layer.succeed(AtomRegistry.AtomRegistry, sharedAtomRegistry), Reactivity.layer);

const MainLayer = Layer.mergeAll(LoggerLayer, AtomReadyLayer, RpcCaptchaClient.layer, RpcContactMeClient.layer, RpcDataClient.layer, Typewriter.layer);

// Reuse the managed runtime's memo map so atom and imperative entry points share service instances
export const RuntimeClient = ManagedRuntime.make(MainLayer);
export const RuntimeAtom = Atom.context({ memoMap: RuntimeClient.memoMap })(MainLayer);
