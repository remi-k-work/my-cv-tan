// services, features, and other libraries
import { Layer, Logger, ManagedRuntime } from "effect";
import { Data } from "@/features/data/services/data";
import { Datasets } from "@/features/data/services/datasets";
import { Markdown } from "@/features/markdown/services/markdown";

const sharedMemoMap = Layer.makeMemoMapUnsafe();

const LoggerLayer = Logger.layer([Logger.consolePretty()]);

// HTML loaders use Data directly; the sitemap document and the Markdown service read the
// required-dataset adapter. The memo map keeps Data and Datasets singletons across the merge.
const MainLayer = Layer.mergeAll(LoggerLayer, Data.layer, Datasets.layer, Markdown.layer);

export const RuntimeServer = ManagedRuntime.make(MainLayer, { memoMap: sharedMemoMap });
