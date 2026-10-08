// tanstack
import { createFileRoute } from "@tanstack/react-router";

// services, features, and other libraries
import { markdownHandler } from "@/features/markdown/services/handlers";

export const Route = createFileRoute("/education.md")({ server: { handlers: { GET: markdownHandler(({ education }) => education) } } });
