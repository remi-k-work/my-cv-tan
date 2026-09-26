import "@/assets/styles/globals.css";

// tanstack
import { Outlet, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import { createIsomorphicFn } from "@tanstack/react-start";

// services, features, and other libraries
import { cn } from "@/lib/utils";
import { Effect, Option } from "effect";
import { RuntimeServer } from "@/lib/runtime-server";
import { RuntimeClient } from "@/lib/runtime-client";
import { Data } from "@/features/data/services/data";
import { Lang } from "@/features/data/services/lang";
import { RpcDataClient } from "@/features/data/rpc/client";

// components
import { AtomRegistryProvider } from "@/components/atom-registry-provider";
import Header from "@/components/header";
import MySkills from "@/components/MySkills";
import { Toaster } from "@/components/ui/sonner";

// assets
import "@fontsource/outfit";

// types
import type { ReactNode } from "react";

// constants
import { ROOT_HEAD } from "@/domain";

const loader = createIsomorphicFn()
  .server(() =>
    RuntimeServer.runPromise(
      Effect.gen(function* () {
        const { resolve } = yield* Lang;
        const data = yield* Data;
        const preferredLanguage = yield* resolve(Option.none());

        const { localizedContent } = yield* Effect.all(
          { localizedContent: data.localizedContent(Option.some(preferredLanguage), Option.none()) },
          { concurrency: "unbounded" }
        ).pipe(Effect.tapError(Effect.logError));

        return { preferredLanguage, localizedContent: localizedContent.valueOrUndefined ?? {} } as const;
      })
    )
  )
  .client(() =>
    RuntimeClient.runPromise(
      Effect.gen(function* () {
        const rpcLangClient = yield* RpcDataClient;
        const { preferredLanguage, localizedContent } = yield* Effect.all(
          { preferredLanguage: rpcLangClient.preferredLanguage(), localizedContent: rpcLangClient.localizedContent() },
          { concurrency: "unbounded" }
        ).pipe(Effect.tapError(Effect.logError));

        return { preferredLanguage, localizedContent: localizedContent.valueOrUndefined ?? {} } as const;
      })
    )
  );

export const Route = createRootRoute({ head: () => ROOT_HEAD, loader: () => loader(), component: RootComponent });

function RootComponent() {
  const { preferredLanguage, localizedContent } = Route.useLoaderData();

  return (
    <RootDocument>
      <AtomRegistryProvider>
        <Header preferredLanguage={preferredLanguage} localizedContent={localizedContent} />
        <MySkills />
        <main className="[grid-area:main]">
          <Outlet />
        </main>
        <Toaster richColors />
      </AtomRegistryProvider>
    </RootDocument>
  );
}

function RootDocument({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" translate="no">
      <head>
        <HeadContent />
      </head>
      <body
        className={cn(
          "grid font-outfit antialiased",
          "grid-cols-[1fr] grid-rows-[11rem_1fr_7rem] [grid-template-areas:'header''main''skills']",
          "lg:grid-cols-[11rem_1rem_1fr_1rem] lg:grid-rows-[7rem_1fr] lg:[grid-template-areas:'skills_header_header_header''skills_._main_.']"
        )}
      >
        {children}
        <Scripts />
      </body>
    </html>
  );
}
