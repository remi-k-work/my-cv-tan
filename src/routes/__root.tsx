import "@/assets/styles/globals.css";

// tanstack
import { Outlet, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";

// services, features, and other libraries
import { cn } from "@/lib/utils";
import { getLocale, getTranslationsSnapshot, useGT } from "gt-tanstack-start";
import { ROOT_HEAD } from "@/features/meta/domain/root";
import { preferredLanguageFromLocale } from "@/domain/helpers";

// components
import { GTProvider } from "gt-tanstack-start";
import { AtomRegistryProvider } from "@/ui/atom-registry-provider";
import { Toastify } from "@/ui/toastify";
import { Header } from "@/ui/header";
import { Skills } from "@/ui/skills";

// assets
// Only the two weights the design uses (regular body copy + semibold accents); the full
// barrel would emit @font-face rules and font files for all nine weights
import "@fontsource/outfit/400.css";
import "@fontsource/outfit/600.css";

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
  const gt = useGT();

  return (
    <div
      className={cn(
        "isolate grid grid-cols-[1fr] grid-rows-[11rem_1fr_7rem] [grid-template-areas:'header''main''skills']",
        "lg:grid-cols-[11rem_1rem_1fr_1rem] lg:grid-rows-[7rem_1fr] lg:[grid-template-areas:'skills_header_header_header''skills_._main_.']"
      )}
    >
      {/* First focusable element in the layout, so keyboard users can bypass the nav and skills rail */}
      <a href="#main-content" className="skip-link">
        {gt("Skip to Main Content")}
      </a>
      <Header />
      <Skills />
      <main id="main-content" tabIndex={-1} className="overflow-clip [grid-area:main]">
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
