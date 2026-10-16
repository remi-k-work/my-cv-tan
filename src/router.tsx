// tanstack
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

// services, features, and other libraries
import { initializeGT } from "gt-tanstack-start";
import { loadTranslations } from "@/lib/gt-translations";

// constants
import gtConfig from "../gt.config.json";

// No-op reload: without it GT falls back to a full window.location.reload() on locale
// changes; the LangChanger instead invalidates the router to re-run loaders softly
initializeGT({ ...gtConfig, loadTranslations, _reload: () => {} });

// Intent preloading: hovering/focusing a link starts the route's chunk + loader before the click,
// so navigation resolves from the warm cache (the loaders are cheap local reads)
export const getRouter = () => createRouter({ routeTree, scrollRestoration: true, defaultPreload: "intent" });
