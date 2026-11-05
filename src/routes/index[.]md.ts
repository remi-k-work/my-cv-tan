// tanstack
import { createFileRoute } from "@tanstack/react-router";

// services, features, and other libraries
import { homeHandler } from "@/features/markdown/services/handlers";

export const Route = createFileRoute("/index.md")({ server: { handlers: { GET: homeHandler } } });
