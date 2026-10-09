// tanstack
import { createFileRoute } from "@tanstack/react-router";

// services, features, and other libraries
import { llmsTxtHandler } from "@/features/markdown/services/handlers";

// Machine-readable site index for AI systems (GEO); the document itself is built in
// features/markdown alongside the .md twins so all AI-facing content lives together
export const Route = createFileRoute("/llms.txt")({ server: { handlers: { GET: llmsTxtHandler } } });
