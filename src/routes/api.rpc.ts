// tanstack
import { createFileRoute } from "@tanstack/react-router";

// services, features, and other libraries
import { handler } from "@/rpc/handlers";

const effectHandler = ({ request }: { request: Request }) => handler.handler(request);

export const Route = createFileRoute("/api/rpc")({ server: { handlers: { POST: effectHandler } } });
