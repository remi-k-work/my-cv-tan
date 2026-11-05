// tanstack
import { createFileRoute } from "@tanstack/react-router";

// services, features, and other libraries
import { robotsHandler } from "@/features/meta/services/handlers";

export const Route = createFileRoute("/robots.txt")({ server: { handlers: { GET: robotsHandler } } });
