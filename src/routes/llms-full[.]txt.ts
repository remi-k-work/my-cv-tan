// tanstack
import { createFileRoute } from "@tanstack/react-router";

// services, features, and other libraries
import { llmsFullTxtHandler } from "@/features/markdown/services/handlers";

// Machine-readable full-content companion of llms.txt (GEO): every Markdown twin in one request
export const Route = createFileRoute("/llms-full.txt")({ server: { handlers: { GET: llmsFullTxtHandler } } });
