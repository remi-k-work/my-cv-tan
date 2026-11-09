// tanstack
import { createFileRoute } from "@tanstack/react-router";

// services, features, and other libraries
import { llmsFullTxtHandler } from "@/features/markdown/services/handlers";

// Full site content endpoint for single-request ingestion (GEO)
export const Route = createFileRoute("/llms-full.txt")({ server: { handlers: { GET: llmsFullTxtHandler } } });
