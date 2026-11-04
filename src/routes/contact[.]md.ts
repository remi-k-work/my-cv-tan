// tanstack
import { createFileRoute } from "@tanstack/react-router";

// services, features, and other libraries
import { contactHandler } from "@/features/markdown/services/markdown";

export const Route = createFileRoute("/contact.md")({ server: { handlers: { GET: contactHandler } } });
