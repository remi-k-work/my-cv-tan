// Server routes can inherit Set-Cookie from request middleware even when their content is public
// and independent of the visitor. Direct handler tests have no Start response context.
import { removeResponseHeader } from "@tanstack/react-start/server";

export const removeSetCookieHeader = () => {
  try {
    removeResponseHeader("set-cookie");
  } catch {
    // A direct handler call has no Start response context to update.
  }
};
