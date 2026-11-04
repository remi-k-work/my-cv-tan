// tanstack
import { createFileRoute } from "@tanstack/react-router";

// services, features, and other libraries
import { educationHandler } from "@/features/markdown/services/markdown";

export const Route = createFileRoute("/education.md")({ server: { handlers: { GET: educationHandler } } });
