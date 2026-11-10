// tanstack
import { createFileRoute } from "@tanstack/react-router";

// services, features, and other libraries
import { robotsHandler } from "@/features/meta/domain/robots";

export const Route = createFileRoute("/robots.txt")({ server: { handlers: { GET: robotsHandler } } });
