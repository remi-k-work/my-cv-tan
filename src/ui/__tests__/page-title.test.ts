import { assert, it } from "@effect/vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { PageTitle } from "@/ui/page-title";

it("renders the stable heading in the H1 while the supporting copy stays outside it", () => {
  const html = renderToStaticMarkup(createElement(PageTitle, { heading: "Contact Me", eyebrow: "Changing contact eyebrow", intro: "Contact summary." }));
  const heading = /<h1\b[^>]*>([\s\S]*?)<\/h1>/.exec(html)?.[1] ?? "";

  assert.include(heading, "Contact Me");
  // The rotating eyebrow is supporting copy, never the identity heading
  assert.notInclude(heading, "Changing contact eyebrow");
  assert.include(html, "Changing contact eyebrow");
  assert.include(html, "Contact summary.");
});