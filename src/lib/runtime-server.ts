// services, features, and other libraries
import { Layer, Logger, ManagedRuntime } from "effect";
import { Data } from "@/features/data/services/data";
import { Datasets } from "@/features/data/services/datasets";
import { Markdown } from "@/features/markdown/services/markdown";

const sharedMemoMap = Layer.makeMemoMapUnsafe();

const LoggerLayer = Logger.layer([Logger.consolePretty()]);

// HTML loaders use Data directly; machine-readable documents read the required-dataset adapter.
// Markdown resolves Datasets when its layer is built, so it must be provided after the base layers
// rather than merged beside them; the memo map keeps Data and Datasets singletons across the merge
const BaseLayer = Layer.mergeAll(LoggerLayer, Data.layer, Datasets.layer);
const MainLayer = Markdown.layer.pipe(Layer.provideMerge(BaseLayer));

export const RuntimeServer = ManagedRuntime.make(MainLayer, { memoMap: sharedMemoMap });

// The services MainLayer composes: a document pipeline may require any subset of them, and the
// runtime satisfies the rest; server routes declare their pipelines against this rather than
// restating the layer list, so a pipeline that needs a service stays a compile error until the
// runtime actually provides it
export type ServerServices = Data | Datasets | Markdown;
