import "@/assets/styles/globals.css";

// tanstack
import { Outlet, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";

// services, features, and other libraries
import { cn } from "@/lib/utils";
import { getLocale, getTranslationsSnapshot } from "gt-tanstack-start";
import { ROOT_HEAD } from "@/features/meta/domain";
import { preferredLanguageFromLocale } from "@/features/data/domain";

// components
import { GTProvider } from "gt-tanstack-start";
import { AtomRegistryProvider } from "@/ui/atom-registry-provider";
import { Toastify } from "@/ui/toastify";
import { Header } from "@/ui/header";
import { Skills } from "@/ui/skills";
import { ScrollProgress } from "@/ui/scroll-progress";

// assets
import "@fontsource/outfit";

// types
import type { ReactNode } from "react";

export const Route = createRootRoute({
  head: () => ROOT_HEAD,
  loader: async () => {
    const locale = getLocale();
    return { locale, preferredLanguage: preferredLanguageFromLocale(locale), translations: await getTranslationsSnapshot(locale) } as const;
  },
  component: RootComponent,
  shellComponent: RootDocument,
});

function RootComponent() {
  return (
    <div
      className={cn(
        "isolate grid grid-cols-[1fr] grid-rows-[11rem_1fr_7rem] [grid-template-areas:'header''main''skills']",
        "lg:grid-cols-[11rem_1rem_1fr_1rem] lg:grid-rows-[7rem_1fr] lg:[grid-template-areas:'skills_header_header_header''skills_._main_.']"
      )}
    >
      {/* Ambient glows drifting behind every page; pure decoration, so they stay out of the a11y tree and never await any JavaScript */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-1 overflow-hidden">
        <div className="absolute top-[-20%] left-[-15%] size-[70vmax] animate-aurora-a rounded-full bg-[radial-gradient(circle_at_center,color-mix(in_oklab,var(--secondary)_15%,transparent),transparent_65%)]" />
        <div className="absolute right-[-15%] bottom-[-20%] size-[70vmax] animate-aurora-b rounded-full bg-[radial-gradient(circle_at_center,color-mix(in_oklab,var(--accent)_8%,transparent),transparent_65%)]" />
      </div>
      <Header />
      <Skills />
      <ScrollProgress />
      <main className="overflow-clip [grid-area:main]">
        <Outlet />
      </main>
    </div>
  );
}

// The html document shell; the router streams the route components into it
function RootDocument({ children }: { children: ReactNode }) {
  const { locale, translations } = Route.useLoaderData();

  return (
    <html lang={locale} translate="no">
      <head>
        <HeadContent />
      </head>
      <body className="relative font-outfit antialiased">
        <GTProvider locale={locale} translations={translations}>
          <AtomRegistryProvider>
            <Toastify>{children}</Toastify>
          </AtomRegistryProvider>
        </GTProvider>
        <Scripts />
      </body>
    </html>
  );
}
