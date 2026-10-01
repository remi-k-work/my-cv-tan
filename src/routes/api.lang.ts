// tanstack
import { createFileRoute } from "@tanstack/react-router";

// services, features, and other libraries
import { handler } from "@/features/data/http/handlers.server";

const effectHandler = ({ request }: { request: Request }) => handler.handler(request);

export const Route = createFileRoute("/api/lang")({ server: { handlers: { POST: effectHandler } } });
