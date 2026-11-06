// The twin bodies are authored from English dictionary keys, so a pinned Polish twin is only Polish
// when the runtime translation snapshot resolves those keys. Every other Polish-twin test injects a
// hand-written `translate`, which passes even if the snapshot wiring regressed and the pipeline
// silently fell back to the English source — leaving a document whose frontmatter (authored
// portfolio data) reads Polish beside section headings that read English.

// services, features, and other libraries
import { assert, it } from "@effect/vitest";
import { initializeGT } from "gt-tanstack-start";
import gtConfig from "../../../../gt.config.json";
import { loadTranslations } from "@/lib/gt-translations";

// handlers under test
import { contactHandler, educationHandler, experienceHandler, homeHandler } from "../services/handlers";

// assets
import experienceEn from "@/assets/data/en/experience.json";

// The router initializes GT once at module scope and a server route is only ever reached after
// that, so the test runtime has to do the same before a pinned twin can read a snapshot.
initializeGT({ ...gtConfig, loadTranslations, _reload: () => {} });

const pinned = (path: string) => new Request(`https://www.remiforge.dev${path}?lang=pl`);

it("a pinned Polish twin resolves its section copy from the runtime translation dictionary", async () => {
  const home = await (await homeHandler({ request: pinned("/index.md") })).text();

  // Section headings and shared labels are dictionary keys, so these are only Polish when the
  // snapshot resolves them
  assert.include(home, "## Doświadczenie");
  assert.include(home, "## Projekty do Portfolio");
  assert.include(home, "## Strony");
  assert.include(home, "[Edukacja i Certyfikaty](https://www.remiforge.dev/education.md?lang=pl)");
  // Contrast the two sources: the frontmatter identity is authored portfolio data, so it is Polish
  // with or without the dictionary and a dictionary regression cannot pass for a translated document
  assert.include(home, "Programista stron internetowych");

  const education = await (await educationHandler({ request: pinned("/education.md") })).text();
  assert.include(education, "## Edukacja");
  assert.include(education, "## Dokumenty");

  const contact = await (await contactHandler({ request: pinned("/contact.md") })).text();
  assert.include(contact, "## Kanały");
  assert.include(contact, "Formularz Kontaktowy:");
  assert.include(contact, "Lokalizacja: Rzeszów, Polska");
});

it("a pinned Polish twin translates its detail sections and link labels", async () => {
  const slug = experienceEn[0]!.slug;
  const detail = await (await experienceHandler({ request: pinned(`/${encodeURIComponent(slug)}.md`) })).text();

  assert.include(detail, "## Opis");
  assert.include(detail, "## Szczegóły");
  assert.include(detail, "## Wykorzystane Umiejętności");
  assert.include(detail, "Rola: ");
  // The crawl graph's home link is a dictionary label too, so it follows the reader's language
  assert.include(detail, "[Strona główna](https://www.remiforge.dev/index.md?lang=pl)");
});

it("an English-pinned twin stays the source language no dictionary lookup can change", async () => {
  const home = await (await homeHandler({ request: new Request("https://www.remiforge.dev/index.md?lang=en") })).text();

  assert.include(home, "## Experience");
  assert.include(home, "## Portfolio Projects");
  assert.notInclude(home, "## Doświadczenie");
});
