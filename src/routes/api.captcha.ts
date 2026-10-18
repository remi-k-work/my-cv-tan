// tanstack
import { createFileRoute } from "@tanstack/react-router";

// services, features, and other libraries
import { routeHandler } from "@/domain/helpers";
import { handler } from "@/features/captcha/http/handlers.server";

export const Route = createFileRoute("/api/captcha")({ server: { handlers: { GET: routeHandler(handler) } } });
