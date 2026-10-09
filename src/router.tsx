// tanstack
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

// services, features, and other libraries
import { initializeGT } from "gt-tanstack-start";
import { loadTranslations } from "@/lib/gt-translations";

// constants
import gtConfig from "../gt.config.json";

// No-op reload: without it GT falls back to a full window.location.reload() on locale
// changes; the LangChanger instead invalidates the router to re-run loaders softly.
initializeGT({ ...gtConfig, loadTranslations, _reload: () => {} });

export const getRouter = () => createRouter({ routeTree, scrollRestoration: true });
