export async function loadTranslations(locale: string): Promise<unknown> {
  return (await import(`../_gt/${locale}.json`)).default;
}
