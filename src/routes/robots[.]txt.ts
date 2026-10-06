// tanstack
import { createFileRoute } from "@tanstack/react-router";

// services, features, and other libraries
import { buildRobotsTxt } from "@/features/meta/domain";
import { txtResponse } from "@/features/markdown/domain";

export const Route = createFileRoute("/robots.txt")({ server: { handlers: { GET: () => txtResponse(buildRobotsTxt()) } } });
