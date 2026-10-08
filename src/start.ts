// tanstack
import { createStart, createCsrfMiddleware, createMiddleware } from "@tanstack/react-start";
import { gtMiddleware } from "gt-tanstack-start";
import { applyHtmlDataUnavailableResponse } from "@/features/data/http/html-response";

const csrfMiddleware = createCsrfMiddleware({
  filter: (ctx) => ctx.handlerType === "serverFn",
});

const htmlDataResponseMiddleware = createMiddleware().server(async ({ handlerType, request, next }) => {
  const result = await next();
  if (handlerType !== "router") return result;

  if (result instanceof Response) return applyHtmlDataUnavailableResponse(request, result);

  const response = applyHtmlDataUnavailableResponse(request, result.response);
  return response === result.response ? result : { ...result, response };
});

export const startInstance = createStart(() => ({
  requestMiddleware: [gtMiddleware, csrfMiddleware, htmlDataResponseMiddleware],
}));
