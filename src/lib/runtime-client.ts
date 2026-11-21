// services, features, and other libraries
import { Layer, Logger, ManagedRuntime } from "effect";
import { Atom, AtomRegistry, Reactivity } from "effect/reactivity";
import { RpcCaptchaClient } from "@/features/captcha/rpc/client";
import { RpcContactMeClient } from "@/features/contact-me/rpc/client";
import { RpcDataClient } from "@/features/data/rpc/client";
import { Typewriter } from "@/features/typewriter/services/typewriter";

// components
import { sharedAtomRegistry } from "@/ui/atom-registry-provider";

// The atom and imperative entry points share one layer graph, so they also share its service instances
const sharedMemoMap = Layer.makeMemoMapUnsafe();

const LoggerLayer = Logger.layer([Logger.consolePretty()]);
const AtomReadyLayer = Layer.mergeAll(Layer.succeed(AtomRegistry.AtomRegistry, sharedAtomRegistry), Reactivity.layer);

const MainLayer = Layer.mergeAll(LoggerLayer, AtomReadyLayer, RpcCaptchaClient.layer, RpcContactMeClient.layer, RpcDataClient.layer, Typewriter.layer);

export const RuntimeAtom = Atom.context({ memoMap: sharedMemoMap })(MainLayer);
export const RuntimeClient = ManagedRuntime.make(MainLayer, { memoMap: sharedMemoMap });
