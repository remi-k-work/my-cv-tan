// tanstack
import { createFileRoute } from "@tanstack/react-router";

// services, features, and other libraries
import { handler } from "@/features/contact-me/rpc/handlers.server";

const effectHandler = ({ request }: { request: Request }) => handler.handler(request);

export const Route = createFileRoute("/api/rpc/contact-me")({ server: { handlers: { POST: effectHandler } } });
