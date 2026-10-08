export async function loadTranslations(locale: string): Promise<unknown> {
  if (locale === "pl") return (await import("@/_gt/pl.json")).default;
  return (await import("@/_gt/en.json")).default;
}
