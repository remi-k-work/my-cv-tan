// tanstack
import { createFileRoute } from "@tanstack/react-router";

// services, features, and other libraries
import { contactHandler } from "@/features/markdown/services/handlers";

export const Route = createFileRoute("/contact.md")({ server: { handlers: { GET: contactHandler } } });
