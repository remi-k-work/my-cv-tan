// tanstack
import { createFileRoute } from "@tanstack/react-router";

// services, features, and other libraries
import { markdownHandler } from "@/features/markdown/services/handlers";

export const Route = createFileRoute("/{$slug}.md")({ server: { handlers: { GET: markdownHandler(({ experience }) => experience) } } });
