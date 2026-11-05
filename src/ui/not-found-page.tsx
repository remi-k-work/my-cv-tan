// react
import { useId } from "react";

// services, features, and other libraries
import { useLocale } from "gt-tanstack-start";
import { matchPreferredLanguage, preferredLanguageFromLocale } from "@/domain/helpers";

export function NotFoundPage() {
  const headingId = useId();
  const preferredLanguage = preferredLanguageFromLocale(useLocale());

  const heading = matchPreferredLanguage(preferredLanguage, "Not Found", "Nie znaleziono");
  const explanation = matchPreferredLanguage(preferredLanguage, "The requested page could not be found.", "Nie znaleziono żądanej strony.");
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
