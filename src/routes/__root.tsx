import "@/assets/styles/globals.css";

// tanstack
import { Outlet, createRootRoute, HeadContent, Scripts, notFound } from "@tanstack/react-router";

// services, features, and other libraries
import { cn } from "@/lib/utils";
import { ROOT_HEAD } from "@/features/meta/domain";
import { loaderRoot } from "@/loaders/root";

// components
import { AtomRegistryProvider } from "@/ui/atom-registry-provider";
import { Toastify } from "@/ui/toastify";
import { Header } from "@/ui/header";
import { Skills } from "@/ui/skills";

// assets
import "@fontsource/outfit";

// types
import type { ReactNode } from "react";
import type { PreferredLanguage } from "@/domain";

interface RootDocumentProps {
  preferredLanguage: PreferredLanguage;
  children: ReactNode;
}

export const Route = createRootRoute({ head: () => ROOT_HEAD, loader: () => loaderRoot(), component: RootComponent });

function RootComponent() {
  const { preferredLanguage, localizedContent } = Route.useLoaderData();
  if (!localizedContent) throw notFound();

  return (
    <RootDocument preferredLanguage={preferredLanguage}>
      <div
        className={cn(
          "isolate grid grid-cols-[1fr] grid-rows-[11rem_1fr_7rem] [grid-template-areas:'header''main''skills']",
          "lg:grid-cols-[11rem_1rem_1fr_1rem] lg:grid-rows-[7rem_1fr] lg:[grid-template-areas:'skills_header_header_header''skills_._main_.']"
        )}
      >
        <Header preferredLanguage={preferredLanguage} localizedContent={localizedContent} />
        <Skills />
        <main className="[grid-area:main]">
          <Outlet />
        </main>
      </div>
    </RootDocument>
  );
}

function RootDocument({ preferredLanguage, children }: RootDocumentProps) {
  return (
    <html lang={preferredLanguage} translate="no">
      <head>
        <HeadContent />
      </head>
      <body className="relative font-outfit antialiased">
        <AtomRegistryProvider>
          <Toastify>{children}</Toastify>
        </AtomRegistryProvider>
        <Scripts />
      </body>
    </html>
  );
}
