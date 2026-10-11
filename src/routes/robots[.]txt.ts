// tanstack
import { createFileRoute } from "@tanstack/react-router";

// services, features, and other libraries
import { buildRobotsTxt, txtResponse } from "@/features/meta/domain";

export const Route = createFileRoute("/robots.txt")({ server: { handlers: { GET: () => txtResponse(buildRobotsTxt()) } } });
