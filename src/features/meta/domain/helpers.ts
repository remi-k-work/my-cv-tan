// services, features, and other libraries
import { Array, Option, pipe } from "effect";

// constants
import { LLMS_TXT_HREF, MONTH_YEAR, MONTHS, SITE_URL, YEAR_ONLY } from "./constants";

// Canonical absolute URL for a site path
export const absoluteUrl = (path: string) => `${SITE_URL}${path}`;

// Self-referencing hreflang entries; one URL serves both languages (cookie-based), so every locale variant points back at the same canonical URL
export const hreflangLinks = (path: string) =>
  pipe(
    ["en", "pl", "x-default"] as const,
    Array.map((locale) => ({ rel: "alternate", hrefLang: locale, href: absoluteUrl(path) }) as const)
  );

export const canonicalLink = (path: string) => ({ rel: "canonical", href: absoluteUrl(path) }) as const;
export const jsonLdScript = (data: unknown) => ({ type: "application/ld+json", children: JSON.stringify(data) }) as const;

// Machine-readable alternate for a page: points crawlers and AI fetchers at the Markdown twin
export const markdownAlternateLink = (mdHref: string) => ({ rel: "alternate", type: "text/markdown", href: absoluteUrl(mdHref) }) as const;

// llms.txt discovery link, emitted on every page head for GEO crawlers
export const llmsAlternateLink = () => ({ rel: "alternate", type: "text/plain", title: "llms.txt", href: absoluteUrl(LLMS_TXT_HREF) }) as const;

// Share-image URL for an experience; a blank imageName yields None so callers fall back to the global jpeg
export const experienceImageUrl = (imageName: string) =>
  pipe(
    Option.fromNullishOr(imageName),
    Option.filter((name) => name.trim().length > 0),
    Option.map((name) => absoluteUrl(`/images/${name}-a.webp`))
  );

// Experience "year" labels are human prose ("Mar 2026", "2008", even "Too Long").
// Only strict forms reduce to valid ISO 8601; anything else yields None so date
// tags are omitted rather than emitted invalid (a bad date is worse than none).
export const yearToIso = (year: string) =>
  pipe(
    Option.liftPredicate(year, (label) => YEAR_ONLY.test(label)),
    Option.orElse(() =>
      pipe(
        Option.fromNullishOr(MONTH_YEAR.exec(year)),
        Option.flatMap((match) =>
          pipe(
            MONTHS,
            Array.findFirstIndex((month) => month === match[1]),
            Option.map((index) => `${match[2]}-${String(index + 1).padStart(2, "0")}`)
          )
        )
      )
    )
  );
