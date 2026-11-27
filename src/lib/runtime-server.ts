// services, features, and other libraries
import { Layer, Logger, ManagedRuntime } from "effect";
import { Datasets } from "@/features/data/services/datasets";
import { Markdown } from "@/features/markdown/services/markdown";
import { Translation } from "@/features/markdown/services/translation";
import { Robots } from "@/features/discovery/services/robots";
import { Sitemap } from "@/features/discovery/services/sitemap";
import { Discovery } from "@/features/discovery/services/llms";
import { EntityTags } from "./entity-tags";

const LoggerLayer = Logger.layer([Logger.consolePretty()]);

// The services the runtime composes. Datasets resolves Data when its own layer is built and
// publishes it alongside itself, so listing it here is enough: Markdown and Sitemap require
// Datasets, the HTML loaders require Data, and all resolve to the instances that one layer built
const BaseLayer = Layer.mergeAll(LoggerLayer, Datasets.layer, EntityTags.layer, Robots.layer, Translation.layer);
const MainLayer = Layer.mergeAll(Markdown.layer, Sitemap.layer, Discovery.layer).pipe(Layer.provideMerge(BaseLayer));

export const RuntimeServer = ManagedRuntime.make(MainLayer);

// The services MainLayer composes: a document pipeline may require any subset of them, and the
// runtime satisfies the rest; server routes declare their pipelines against this rather than
// restating the layer list, so a pipeline that needs a service stays a compile error until the
// runtime actually provides it; deriving the union from MainLayer keeps the two from drifting
export type ServerServices = Layer.Success<typeof MainLayer>;
