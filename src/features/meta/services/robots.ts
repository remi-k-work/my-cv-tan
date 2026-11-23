// services, features, and other libraries
import { Effect } from "effect";
import { documentRoute } from "@/lib/server-route";
import { ROBOTS_TXT } from "@/features/meta/domain/robots";
import { txtResponse } from "./responses";

export const robotsHandler = documentRoute(() => Effect.sync(() => txtResponse(ROBOTS_TXT)));
