import "@/assets/styles/globals.css";

// tanstack
import { Outlet, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";

// services, features, and other libraries
import { cn } from "@/lib/utils";
import DataLoader from "@/lib/DataLoader";
import { getLang } from "@/server/i18n.functions";

// components
import Header from "@/components/header";
import MySkills from "@/components/MySkills";
import { Toaster } from "@/components/ui/sonner";

// assets
import "@fontsource/outfit";

// types
import type { ReactNode } from "react";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Curious Web Dev: Eager to Learn, Collaborate, and Make a Splash" },
      {
        name: "description",
        content:
          "Passionate, self-taught web developer with a strong drive for continuous learning and a proven track record of delivering results. Eager to contribute to impactful projects, collaborate with experienced teams, and build high-quality web applications.",
      },
      { name: "author", content: "Remi" },
      { name: "robots", content: "index, follow" },
      { name: "category", content: "technology" },
      { name: "google", content: "notranslate" },
    ],
    links: [
      { rel: "canonical", href: "https://www.remiforge.dev/" },
      { rel: "icon", href: "/icon.svg", type: "image/svg+xml" },
      { rel: "og:image", href: "https://www.remiforge.dev/opengraph-image.jpg" },
    ],
  }),
  loader: async () => {
    const lang = await getLang();
    const loader = DataLoader.fromLang(lang);
    return { lang, localizedContent: loader.localizedContent() } as const;
  },
  component: RootComponent,
});

function RootComponent() {
  const { lang, localizedContent } = Route.useLoaderData();

  return (
    <RootDocument>
      <Header preferredLang={lang} localizedContent={localizedContent} />
      <MySkills />
      <main className="[grid-area:main]">
        <Outlet />
      </main>
      <Toaster richColors />
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
