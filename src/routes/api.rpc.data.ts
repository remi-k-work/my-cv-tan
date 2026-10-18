// tanstack
import { createFileRoute } from "@tanstack/react-router";

// services, features, and other libraries
import { routeHandler } from "@/domain/helpers";
import { handler } from "@/features/data/rpc/handlers.server";

export const Route = createFileRoute("/api/rpc/data")({ server: { handlers: { POST: routeHandler(handler) } } });
