// tanstack
import { createFileRoute } from "@tanstack/react-router";

// services, features, and other libraries
import { llmsTxtHandler } from "@/features/markdown/services/handlers";

// AI system site index endpoint (GEO)
export const Route = createFileRoute("/llms.txt")({ server: { handlers: { GET: llmsTxtHandler } } });
