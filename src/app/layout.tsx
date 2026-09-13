import "./globals.css";

// other libraries
import DataLoader from "@/lib/DataLoader";
import { cn } from "@/lib/utils";
import { Analytics } from "@vercel/analytics/next";

// components
import Header from "@/components/header";
import MySkills from "@/components/MySkills";
import { Toaster } from "@/components/ui/sonner";

// assets
import { outfit } from "@/assets/fonts";

// types
import type { Metadata } from "next";

// constants
export const metadata: Metadata = {
  title: "Curious Web Dev: Eager to Learn, Collaborate, and Make a Splash",
  description:
    "Passionate, self-taught web developer with a strong drive for continuous learning and a proven track record of delivering results. Eager to contribute to impactful projects, collaborate with experienced teams, and build high-quality web applications.",
  authors: [{ name: "Remi" }],
  robots: { index: true, follow: true },
  category: "technology",
  other: { google: "notranslate" },

  metadataBase: new URL("https://www.remiforge.dev"),
  alternates: { canonical: "/" },
};

export default async function RootLayout({ exp, children }: LayoutProps<"/">) {
  // Create an instance of the data loader needed for localization
  const { lang, localizedContent } = await DataLoader.create();

  return (
    <html lang="en" translate="no">
      <body
        className={cn(
          `${outfit.variable} font-outfit grid antialiased`,
          "grid-cols-[1fr] grid-rows-[11rem_1fr_7rem] [grid-template-areas:'header''main''skills']",
          "lg:grid-cols-[11rem_1rem_1fr_1rem] lg:grid-rows-[7rem_1fr] lg:[grid-template-areas:'skills_header_header_header''skills_._main_.']",
        )}
      >
        <Header preferredLang={lang} localizedContent={localizedContent()} />
        <MySkills />
        <main className="[grid-area:main]">
          {children}
          {exp}
        </main>
        <Toaster richColors />
        <Analytics debug={false} />
      </body>
    </html>
  );
}
