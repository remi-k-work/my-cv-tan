// tanstack
import { createFileRoute, redirect } from "@tanstack/react-router";

// Legacy /exp/* URLs (e.g. /exp/e/0, /exp/p/7) no longer exist;
// permanently redirect bookmarks and crawlers back to the homepage
export const Route = createFileRoute("/exp/$")({
  loader: () => {
    throw redirect({ to: "/{-$slug}", params: { slug: undefined }, statusCode: 301 });
  },
});
