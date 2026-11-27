// react
import { useId } from "react";

// services, features, and other libraries
import { useLocale } from "gt-tanstack-start";
import { matchPreferredLanguage, preferredLanguageFromLocale } from "@/domain/helpers";

// constants
import { NOT_FOUND_COPY } from "@/domain/site";

export function NotFoundPage() {
  const headingId = useId();
  const preferredLanguage = preferredLanguageFromLocale(useLocale());
  // The <head> publishes the same two strings for this same document, so the page reads them from
  // the degraded-document declaration instead of restating them where a crawler cannot see them
  const { title: heading, description: explanation } = NOT_FOUND_COPY[preferredLanguage];
  // The link back home is nav chrome: it comes from the same static per-language copy the heading
  // above reads, so the degraded document stays fully translated even when the GT dictionary is
  // unavailable — the one moment a fallback document cannot rely on it
  const homeLabel = matchPreferredLanguage(preferredLanguage, "Home page", "Strona główna");

  return (
    <section aria-labelledby={headingId} className="mx-auto flex max-w-4xl flex-col items-center gap-4 px-4 py-12 text-center">
      <h1 id={headingId} className="text-3xl">
        {heading}
      </h1>
      <p>{explanation}</p>
      <a href="/" className="text-accent underline underline-offset-4">
        {homeLabel}
      </a>
    </section>
  );
}
