// The screenshot panel is the fourth surface that publishes an experience's video/live URL, beside
// the Markdown twin, the JSON-LD graph and the HTML link chips. The other three share one http(s)
// guard (`httpUrlOption`), so these tests pin the panel onto the same rule: a destination the site
// refuses to publish must render as plain screenshots rather than as an anchor whose href is the
// authored string verbatim.

// services, features, and other libraries
import { assert, it } from "@effect/vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { GTProvider, initializeGT } from "gt-tanstack-start";
import gtConfig from "../../../../../gt.config.json";
import { loadTranslations } from "@/lib/gt-translations";
import { ScreenShots } from "../screen-shots";

// types
import type { Experience } from "@/features/experience/domain/models";

// The component reads its link labels through GT, so the runtime has to be initialized and the
// render wrapped in a provider — exactly as the not-found head and twin localization tests do.
initializeGT({ ...gtConfig, loadTranslations, _reload: () => {} });

const baseExperience: Experience = {
  type: "p",
  slug: "sample-role",
  year: "Mar 2026",
  role: "Full-Stack Developer",
  company: "Sample Co",
  txt: "Built things with care.",
  imageName: "01",
  skillsUsed: ["TypeScript"],
};

const renderPanel = (experience: Experience) =>
  renderToStaticMarkup(createElement(GTProvider, { locale: "en", translations: {} }, createElement(ScreenShots, { experience })));

const hrefOf = (markup: string) => /<a[^>]*href="([^"]*)"/.exec(markup)?.[1];
const imgs = (markup: string) => markup.match(/<img/g) ?? [];

it("the panel links a published video destination and names it as the video link", () => {
  const markup = renderPanel({ ...baseExperience, videoLink: "https://example.com/video", liveLink: "https://example.com/live" });

  // Ordered video-first, so the panel reads differently from the matching chip in the same slide
  assert.strictEqual(hrefOf(markup), "https://example.com/video");
  assert.include(markup, "Watch Video");
  assert.strictEqual(imgs(markup).length, 3);
});

it("the panel falls back to the published live destination and names it as the live link", () => {
  const markup = renderPanel({ ...baseExperience, liveLink: "https://example.com/live" });

  assert.strictEqual(hrefOf(markup), "https://example.com/live");
  assert.include(markup, "Live Link");
  assert.notInclude(markup, "Watch Video");
});

it("an unparseable video still leaves the live destination linked, under the label that resolved", () => {
  // The video wins only when it is itself publishable: dropping an unparseable video must not
  // strand a project whose live URL is fine
  const markup = renderPanel({ ...baseExperience, videoLink: "ftp://example.com/video", liveLink: "https://example.com/live" });

  assert.strictEqual(hrefOf(markup), "https://example.com/live");
  assert.notInclude(markup, "Watch Video");
});

it("a destination the site refuses to publish renders the screenshots with no anchor at all", () => {
  // The Experience schema accepts any non-empty string, so the panel guard is what keeps a
  // hostile or malformed value out of an href — the same one every other surface applies
  for (const hostile of ["javascript:alert(1)", "data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==", "not a url at all///", "//evil.example/x", "ftp://example.com/file"]) {
    const markup = renderPanel({ ...baseExperience, liveLink: hostile });

    assert.isUndefined(hrefOf(markup), `${hostile} must not publish an href`);
    // The screenshots survive: only the link is dropped
    assert.strictEqual(imgs(markup).length, 3);
  }
});

it("an experience with no link renders the screenshots with no anchor", () => {
  const markup = renderPanel(baseExperience);

  assert.isUndefined(hrefOf(markup));
  assert.notInclude(markup, "<a");
  assert.strictEqual(imgs(markup).length, 3);
});
