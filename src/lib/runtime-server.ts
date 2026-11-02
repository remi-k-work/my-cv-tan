// services, features, and other libraries
import { Layer, Logger, ManagedRuntime } from "effect";
import { Data } from "@/features/data/services/data";
import { Datasets } from "@/features/meta/services/datasets";
import { Markdown } from "@/features/markdown/services/markdown";

const sharedMemoMap = Layer.makeMemoMapUnsafe();

const LoggerLayer = Logger.layer([Logger.consolePretty()]);

// `Data` and the binding built on top of it are both reachable: the HTML loaders still negotiate a
// language per request through `Data` itself, while every document pipeline resolves the shared
// `Datasets` service. The shared memo map builds `Data` once, so the extra edge costs nothing.
//
// `Markdown` already provides `Datasets` inside its own layer (see markdown.ts), so it is merged
// directly rather than re-provided here — doing both would build the binding twice.
const MainLayer = Layer.mergeAll(LoggerLayer, Data.layer, Datasets.layer, Markdown.layer);

export const RuntimeServer = ManagedRuntime.make(MainLayer, { memoMap: sharedMemoMap });
