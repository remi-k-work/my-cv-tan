// tanstack
import { createFileRoute } from "@tanstack/react-router";

// services, features, and other libraries
import { experienceHandler } from "@/features/markdown/services/markdown";

export const Route = createFileRoute("/{$slug}.md")({ server: { handlers: { GET: experienceHandler } } });
