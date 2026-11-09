import { assert, it } from "@effect/vitest";
import { initializeGT } from "gt-tanstack-start";
import gtConfig from "../../../../gt.config.json";
import { loadTranslations } from "@/lib/gt-translations";
import { contactHandler, educationHandler, experienceHandler, homeHandler } from "../services/handlers";
import experienceEn from "@/assets/data/en/experience.json";

// Initializes translation dictionary runtime for unit testing.
initializeGT({ ...gtConfig, loadTranslations, _reload: () => {} });

const pinned = (path: string) => new Request(`https://www.remiforge.dev${path}?lang=pl`);

it("a pinned Polish twin resolves its section copy from the runtime translation dictionary", async () => {
  const home = await (await homeHandler({ request: pinned("/index.md") })).text();

  assert.include(home, "## Doświadczenie");
  assert.include(home, "## Projekty do Portfolio");
  assert.include(home, "## Strony");
  assert.include(home, "[Edukacja i Certyfikaty](https://www.remiforge.dev/education.md?lang=pl)");
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
  assert.include(detail, "[Strona główna](https://www.remiforge.dev/index.md?lang=pl)");
});

it("an English-pinned twin stays the source language no dictionary lookup can change", async () => {
  const home = await (await homeHandler({ request: new Request("https://www.remiforge.dev/index.md?lang=en") })).text();

  assert.include(home, "## Experience");
  assert.include(home, "## Portfolio Projects");
  assert.notInclude(home, "## Doświadczenie");
});
