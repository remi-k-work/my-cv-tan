// services, features, and other libraries
import { Layer, Logger, ManagedRuntime } from "effect";
import { Data } from "@/features/data/services/data";
import { Datasets } from "@/features/data/services/datasets";
import { Markdown } from "@/features/markdown/services/markdown";

const sharedMemoMap = Layer.makeMemoMapUnsafe();

const LoggerLayer = Logger.layer([Logger.consolePretty()]);

// HTML loaders use Data directly; the sitemap document and the Markdown service read the
// required-dataset adapter; the memo map keeps Data and Datasets singletons across the merge
const MainLayer = Layer.mergeAll(LoggerLayer, Data.layer, Datasets.layer, Markdown.layer);

export const RuntimeServer = ManagedRuntime.make(MainLayer, { memoMap: sharedMemoMap });

// The services MainLayer composes: a document pipeline may require any subset of them, and the
// runtime satisfies the rest; server routes declare their pipelines against this rather than
// restating the layer list, so a pipeline that needs a service stays a compile error until the
// runtime actually provides it
export type ServerServices = Data | Datasets | Markdown;
