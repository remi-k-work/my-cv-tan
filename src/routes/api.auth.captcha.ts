// tanstack
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/auth/captcha")({
  server: {
    handlers: {
      GET: async () => {
        const svg =
          `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="50" viewBox="0 0 200 50">` +
          `<rect width="200" height="50" fill="rgb(125,125,125)"/></svg>`;

        return new Response(svg, {
          headers: {
            "Content-Type": "image/svg+xml",
            "Cache-Control": "private, no-store",
          },
        });
      },
    },
  },
});
