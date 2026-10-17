// tanstack
import { createFileRoute } from "@tanstack/react-router";

// services, features, and other libraries
import { buildRobotsTxt } from "@/features/meta/domain/robots";
import { txtResponse } from "@/features/meta/domain/response";

// robots.txt is fully static, so the document is built once at module scope;
// only the Response is minted per request, because a response body is single-use
const robotsTxt = buildRobotsTxt();

export const Route = createFileRoute("/robots.txt")({ server: { handlers: { GET: () => txtResponse(robotsTxt) } } });
