// services, features, and other libraries
import { Layer, Logger, ManagedRuntime } from "effect";
import { Data } from "@/features/data/services/data";
import { Datasets } from "@/features/data/services/datasets";
import { Markdown } from "@/features/markdown/services/markdown";

const sharedMemoMap = Layer.makeMemoMapUnsafe();

const LoggerLayer = Logger.layer([Logger.consolePretty()]);

// The services the runtime composes. Datasets resolves Data when its own layer is built and
// publishes it alongside itself, so listing it here is enough: Markdown requires Datasets, the
// HTML loaders require Data, and both resolve to the instances that one layer built
const BaseLayer = Layer.mergeAll(LoggerLayer, Datasets.layer);
const MainLayer = Markdown.layer.pipe(Layer.provideMerge(BaseLayer));

export const RuntimeServer = ManagedRuntime.make(MainLayer, { memoMap: sharedMemoMap });

// The services MainLayer composes: a document pipeline may require any subset of them, and the
// runtime satisfies the rest; server routes declare their pipelines against this rather than
// restating the layer list, so a pipeline that needs a service stays a compile error until the
// runtime actually provides it
export type ServerServices = Data | Datasets | Markdown;
