// services, features, and other libraries
import { Layer, Logger, ManagedRuntime } from "effect";
import { Data } from "@/features/data/services/data";
import { Markdown } from "@/features/markdown/services/markdown";

const sharedMemoMap = Layer.makeMemoMapUnsafe();

const LoggerLayer = Logger.layer([Logger.consolePretty()]);

// HTML loaders use Data directly; Markdown provides the required dataset adapter in its own layer.
const MainLayer = Layer.mergeAll(LoggerLayer, Data.layer, Markdown.layer);

export const RuntimeServer = ManagedRuntime.make(MainLayer, { memoMap: sharedMemoMap });
