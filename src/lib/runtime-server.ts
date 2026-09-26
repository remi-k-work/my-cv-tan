// services, features, and other libraries
import { Layer, Logger, ManagedRuntime } from "effect";
import { Data } from "@/features/data/services/data";
import { Lang } from "@/features/data/services/lang";

const sharedMemoMap = Layer.makeMemoMapUnsafe();

const LoggerLayer = Logger.layer([Logger.consolePretty()]);
const MainLayer = Layer.mergeAll(LoggerLayer, Data.layer, Lang.layer);

export const RuntimeServer = ManagedRuntime.make(MainLayer, { memoMap: sharedMemoMap });
