// Shared fixtures for the Markdown feature's tests. Keeping them in one place means a change to
// the sample portfolio data or the Polish dictionary cannot make one surface's expectations drift
// from another's.

// services, features, and other libraries
import { Option, Record } from "effect";
import { twinDocument } from "@/features/markdown/domain/format";
import { buildContactMd, buildEducationMd, buildHomeMd } from "@/features/markdown/domain/twins";

// types
import type { PageTitles, Translate } from "@/domain/models";
import type { Experience } from "@/features/experience/domain/models";
import type { ContactMdInput, EducationMdInput, HomeMdInput } from "@/features/markdown/domain/twins";

export const sampleExperience: Experience = {
  type: "e",
  slug: "sample-role",
  year: "Mar 2026",
  role: "Full-Stack Developer",
  company: "Sample Co",
  txt: "Built things with **care** and #hashtags.",
  gitHubLink: "https://github.com/example/repo",
  imageName: "01",
  skillsUsed: ["TypeScript", "React"],
};

export const stablePageTitles: PageTitles = {
  "/": { eyebrow: "Home", heading: "Stable home title", intro: "Stable home summary." },
  "/education": { eyebrow: "Education", heading: "Stable education title", intro: "Stable education summary." },
  "/contact": { eyebrow: "Contact", heading: "Stable contact title", intro: "Stable contact summary." },
};

export const translateEn: Translate = (source) => source;

const polishTranslations: Readonly<Record<string, string>> = {
  Experience: "Doświadczenie",
  "Portfolio Projects": "Projekty do Portfolio",
  Education: "Edukacja",
  Pages: "Strony",
  "Home page": "Strona główna",
  "Education & Certificates": "Edukacja i certyfikaty",
  Contact: "Kontakt",
  "No entries.": "Brak wpisów.",
  Overview: "Opis",
  Details: "Szczegóły",
  Role: "Rola",
  "Skills Used": "Wykorzystane Umiejętności",
  Links: "Linki",
  Documents: "Dokumenty",
  Years: "Lata",
  Location: "Lokalizacja",
  Channels: "Kanały",
  "Contact Form": "Formularz Kontaktowy",
  Base: "Lokalizacja",
  "Rzeszów, Poland": "Rzeszów, Polska",
  "Not Found": "Nie znaleziono",
  "GitHub Repo": "Repozytorium GitHub",
  "Live Link": "Link na Żywo",
  "Watch Video": "Zobacz Video",
};

// A miss in the dictionary is the source string itself, expressed as the same typed absence the
// rest of the feature reads rather than an undefined index lookup
export const translatePl: Translate = (source) => Option.getOrElse(Record.get(polishTranslations, source), () => source);

// Builders return a twin; tests almost always want the serialized document.
export const homeTwin = (input: HomeMdInput) => twinDocument(buildHomeMd(input));
export const educationTwin = (input: EducationMdInput) => twinDocument(buildEducationMd(input));
export const contactTwin = (input: ContactMdInput) => twinDocument(buildContactMd(input));
