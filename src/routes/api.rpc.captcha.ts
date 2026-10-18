// tanstack
import { createFileRoute } from "@tanstack/react-router";

// services, features, and other libraries
import { routeHandler } from "@/domain/helpers";
import { handler } from "@/features/captcha/rpc/handlers.server";

export const Route = createFileRoute("/api/rpc/captcha")({ server: { handlers: { POST: routeHandler(handler) } } });
