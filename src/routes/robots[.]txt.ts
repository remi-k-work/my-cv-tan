// tanstack
import { createFileRoute } from "@tanstack/react-router";

// services, features, and other libraries
import { txtResponse } from "@/features/meta/domain/response";

// constants
import { ROBOTS_TXT } from "@/features/meta/domain/robots";

// robots.txt is fully static: the document constant lives in the meta domain, and only the
// Response is minted per request, because a response body is single-use
export const Route = createFileRoute("/robots.txt")({ server: { handlers: { GET: () => txtResponse(ROBOTS_TXT) } } });
