// tanstack
import { createFileRoute } from "@tanstack/react-router";

// services, features, and other libraries
import { llmsTxtHandler } from "@/features/markdown/services/handlers";

// Machine-readable site index for AI systems (GEO); the document is built in
// features/markdown/domain/indexes.ts alongside the llms-full.txt companion
export const Route = createFileRoute("/llms.txt")({ server: { handlers: { GET: llmsTxtHandler } } });
