import { RequiredDataError } from "@/features/data/domain/required";

const unavailableHtmlRequests = new WeakSet<Request>();

export const markHtmlDataUnavailable = (request: Request, error: unknown) => {
  if (error instanceof RequiredDataError) unavailableHtmlRequests.add(request);
};

export const applyHtmlDataUnavailableResponse = (request: Request, response: Response) => {
  if (!unavailableHtmlRequests.has(request) || !response.headers.get("content-type")?.includes("text/html")) return response;

  unavailableHtmlRequests.delete(request);
  const headers = new Headers(response.headers);
  headers.set("Cache-Control", "no-store");
  headers.set("X-Robots-Tag", "noindex, follow");

  return new Response(response.body, { status: 503, statusText: "Service Unavailable", headers });
};
