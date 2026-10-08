import "@/assets/styles/globals.css";

// tanstack
import { Outlet, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";

// services, features, and other libraries
import { cn } from "@/lib/utils";
import { getLocale, getTranslationsSnapshot, initializeGT } from "gt-tanstack-start";
import { loadTranslations } from "@/lib/gt-translations";
import { ROOT_HEAD } from "@/features/meta/domain";
import { loaderRoot } from "@/loaders/root";

// components
import { GTProvider } from "gt-tanstack-start";
import { AtomRegistryProvider } from "@/ui/atom-registry-provider";
import { Toastify } from "@/ui/toastify";
import { Header } from "@/ui/header";
import { Skills } from "@/ui/skills";

// assets
import "@fontsource/outfit";

// types
import type { ReactNode } from "react";

interface RootDocumentProps {
  locale: string;
  translations: Awaited<ReturnType<typeof getTranslationsSnapshot>>;
  children: ReactNode;
}

// constants
import gtConfig from "../../gt.config.json";

initializeGT({ ...gtConfig, loadTranslations, _reload: () => {} });

export const Route = createRootRoute({
  head: () => ROOT_HEAD,
  loader: async () => {
    const locale = getLocale();
    const [rootData, translations] = await Promise.all([loaderRoot(), getTranslationsSnapshot(locale)]);
    return { ...rootData, locale, translations } as const;
  },
  component: RootComponent,
});

function RootComponent() {
  const { locale, localizedContent, translations } = Route.useLoaderData();

  return (
    <RootDocument locale={locale} translations={translations}>
      <div
        className={cn(
          "isolate grid grid-cols-[1fr] grid-rows-[11rem_1fr_7rem] [grid-template-areas:'header''main''skills']",
          "lg:grid-cols-[11rem_1rem_1fr_1rem] lg:grid-rows-[7rem_1fr] lg:[grid-template-areas:'skills_header_header_header''skills_._main_.']"
        )}
      >
        <Header localizedContent={localizedContent} />
        <Skills />
        <main className="[grid-area:main]">
          <Outlet />
        </main>
      </div>
    </RootDocument>
  );
}

function RootDocument({ locale, translations, children }: RootDocumentProps) {
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
