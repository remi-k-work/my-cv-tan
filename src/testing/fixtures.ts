// The sample records and copy the cross-feature tests share. One definition per value means a
// change to the sample portfolio data, the page catalogue copy or the Polish dictionary cannot make
// one surface's expectations drift from another's.
//
// Two experience samples are exported because the two kinds differ in more than a flag: the
// employment kind localizes its headline as "<role> at <company>" and renders `work-experience`
// twins, while the portfolio kind uses the bare role and renders project twins. Tests on either
// side need their own kind.
//
// Readers that parse a rendered document back live with the feature that owns the format:
// JSON-LD graph readers in `@/features/jsonld/domain/__tests__/fixtures` and meta-tag readers in
// `@/features/meta/domain/__tests__/readers`.

// services, features, and other libraries
import { Option, Record } from "effect";
import { twinDocument } from "@/features/markdown/domain/format";
import { buildContactMd, buildEducationMd, buildHomeMd } from "@/features/markdown/domain/twins";

// types
import type { PageTitles, Translate } from "@/domain/models";
import type { EducationList } from "@/features/education/domain/models";
import type { Experience } from "@/features/experience/domain/models";
import type { ContactMdInput, EducationMdInput, HomeMdInput } from "@/features/markdown/domain/twins";

// The employment sample exercises the richer narrative and employment headline every Markdown and
// llms surface renders, so its `txt` carries the inline Markdown markers those tests assert.
export const sampleEmployment: Experience = {
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

// The portfolio sample keeps the same identity so the two kinds cannot drift, but a plain narrative
// and the project headline the HTML head and sitemap surfaces assert.
export const samplePortfolio: Experience = {
  ...sampleEmployment,
  type: "p",
  txt: "Built things with care.",
};

export const sampleEducation: EducationList = [{ name: "Pratt Institute", year: "• 2002 — 2004 •", location: "New York, US", info: "Interactive Media." }];

export const stablePageTitles: PageTitles = {
  "/": { eyebrow: "Home", heading: "Stable home title", intro: "Stable home description." },
  "/education": { eyebrow: "Education", heading: "Stable education title", intro: "Stable education description." },
  "/contact": { eyebrow: "Contact", heading: "Stable contact title", intro: "Stable contact description." },
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
  "GitHub Repo": "Repozytorium GitHub",
  "Live Link": "Link na Żywo",
  "Watch Video": "Zobacz Video",
  See: "Zobacz",
  or: "lub",
};

// A miss in the dictionary is the source string itself, expressed as the same typed absence the
// rest of the feature reads rather than an undefined index lookup
export const translatePl: Translate = (source) => Option.getOrElse(Record.get(polishTranslations, source), () => source);

// Builders return a twin; tests almost always want the serialized document.
export const homeTwin = (input: HomeMdInput) => twinDocument(buildHomeMd(input));
export const educationTwin = (input: EducationMdInput) => twinDocument(buildEducationMd(input));
export const contactTwin = (input: ContactMdInput) => twinDocument(buildContactMd(input));