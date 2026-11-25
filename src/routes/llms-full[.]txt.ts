// tanstack
import { createFileRoute } from "@tanstack/react-router";

// services, features, and other libraries
import { llmsFullTxtHandler } from "@/features/markdown/services/handlers";

// Intentionally unilingual English site content for single-request AI ingestion (GEO)
export const Route = createFileRoute("/llms-full.txt")({ server: { handlers: { GET: llmsFullTxtHandler, HEAD: llmsFullTxtHandler } } });
