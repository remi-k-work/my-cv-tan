import "@/assets/styles/globals.css";

// tanstack
import { Outlet, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";

// services, features, and other libraries
import { cn } from "@/lib/utils";
import DataLoader from "@/lib/DataLoader";
import { getLang } from "@/server/i18n.functions";

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

export const Route = createRootRoute({
  head: () => ROOT_HEAD,
  loader: async () => {
    const preferredLanguage = await getLang();
    const loader = DataLoader.fromLang(preferredLanguage);
    return { preferredLanguage, localizedContent: loader.localizedContent } as const;
  },
  component: RootComponent,
});

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
