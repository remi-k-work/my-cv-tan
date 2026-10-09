// tanstack
import { createFileRoute } from "@tanstack/react-router";

// services, features, and other libraries
import { educationHandler } from "@/features/markdown/services/handlers";

export const Route = createFileRoute("/education.md")({ server: { handlers: { GET: educationHandler } } });
