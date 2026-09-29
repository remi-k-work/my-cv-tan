// tanstack
import { createFileRoute, redirect } from "@tanstack/react-router";

// Bare legacy /exp URL; permanently redirect back to the homepage.
export const Route = createFileRoute("/exp/")({
  loader: () => {
    throw redirect({ to: "/{-$slug}", params: { slug: undefined }, search: { modal: undefined }, statusCode: 301 });
  },
});
