// The site-identity constants are published as-is onto several crawler-facing surfaces: the
// `rel="me"` links in every document head, the JSON-LD `sameAs` edges, the Open Graph card image,
// the `meta description` and the branded `<title>`. None of the builders that consume them validate
// what they hand over, so the invariants those publications depend on are pinned here, once,
// against the constants themselves rather than against one surface's reading of them.

import { assert, it } from "@effect/vitest";
import { Option } from "effect";
import {
  AUTHOR_URL,
  AVATAR,
  BRANDED_TITLE,
  GLOBAL_SOCIAL_IMAGE,
  HOME_COUNTRY,
  HOME_COUNTRY_NAME,
  HOME_LOCALITY,
  HOME_TITLE,
  HOME_URL,
  JOB_TITLE,
  KNOWS_ABOUT,
  META_DESCRIPTION_LENGTH,
  PERSON_DESCRIPTION,
  PUBLISHER_URL,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_URL,
  SOCIAL_LINKS,
  SOCIAL_PROFILES,
} from "../site";
import { httpUrlOption } from "../urls";
import { OPEN_GRAPH_LOCALES } from "../site";
import { SITE_LANGUAGE_NAMES } from "@/domain/constants";

it("the canonical origin and every profile it publishes are absolute https URLs", () => {
  // `rel="me"` and JSON-LD `sameAs` are read as destinations, so a relative or non-http value
  // would publish a link that resolves nowhere — or resolves to a scheme the site never intended.
  assert.isTrue(SITE_URL.startsWith("https://"));
  // A trailing slash would make `SITE_URL` and `HOME_URL` spell the origin two ways.
  assert.isFalse(SITE_URL.endsWith("/"));

  assert.strictEqual(HOME_URL, `${SITE_URL}/`);
  assert.strictEqual(AUTHOR_URL, HOME_URL);
  assert.strictEqual(PUBLISHER_URL, HOME_URL);

  assert.isTrue(SOCIAL_PROFILES.length > 0);
  for (const { name, href } of SOCIAL_PROFILES) {
    // A profile with no readable name would publish a bare URL, and an AI reader has to guess
    // which network it belongs to.
    assert.isAbove(name.length, 0, `${href} declares no name`);
    assert.deepStrictEqual(httpUrlOption(href), Option.some(href), `${name} publishes an unpublished destination`);
  }
  // SOCIAL_LINKS is the projection the graph publishes, so it is the same set in the same order.
  assert.deepStrictEqual(
    SOCIAL_LINKS,
    SOCIAL_PROFILES.map(({ href }) => href)
  );
});

it("the share image satisfies the Open Graph standard size and the avatar satisfies a square logo", () => {
  // og:image is rendered by scrapers without probing dimensions, so a card publishing the wrong
  // size is cropped or letterboxed; a schema.org logo must be square.
  assert.strictEqual(GLOBAL_SOCIAL_IMAGE.width, 1200);
  assert.strictEqual(GLOBAL_SOCIAL_IMAGE.height, 630);
  assert.strictEqual(GLOBAL_SOCIAL_IMAGE.mime, "image/jpeg");

  assert.isTrue(GLOBAL_SOCIAL_IMAGE.src.startsWith(`${SITE_URL}/`));
  assert.isTrue(AVATAR.src.startsWith(`${SITE_URL}/`));
  assert.strictEqual(AVATAR.width, AVATAR.height);
  assert.isAbove(AVATAR.width, 0);
});

it("the authored copy fits inside the length limits the meta tags are read under", () => {
  // The site description is published verbatim as the `meta description` and as the WebSite and
  // Organization node descriptions, so a value past the snippet cap is silently truncated by every
  // search engine and the full claim is never read.
  assert.isTrue(SITE_DESCRIPTION.length <= META_DESCRIPTION_LENGTH, `${SITE_DESCRIPTION.length} characters exceeds ${META_DESCRIPTION_LENGTH}`);
  // The branded title template must stay far shorter still: search engines cut it from the end, so
  // a long suffix would push the page's own title out of the result entirely.
  assert.isTrue(BRANDED_TITLE(HOME_TITLE).length < META_DESCRIPTION_LENGTH);

  // The brand separator is what a reader sees between the site and the page, so it is pinned
  // rather than left to a template nobody asserts.
  assert.strictEqual(BRANDED_TITLE("Education & Certificates"), `${SITE_NAME} ● Education & Certificates`);

  // The biography feeds the Person node and the AI index prose; it is allowed to be long, but it
  // must still be a description of the person the graph claims.
  assert.isAbove(PERSON_DESCRIPTION.length, 0);
  assert.include(PERSON_DESCRIPTION, "web developer");
  assert.include(SITE_DESCRIPTION, SITE_NAME);
});

it("the location and role claims stay consistent with the title the site publishes itself under", () => {
  // The homepage title, the Person jobTitle and the PostalAddress are three independent claims an
  // AI reader cross-checks; a drift between them is a contradiction it can cite back.
  assert.strictEqual(JOB_TITLE, "Web Developer");
  assert.include(HOME_TITLE, JOB_TITLE);
  assert.include(HOME_TITLE, HOME_LOCALITY);
  assert.include(HOME_TITLE, HOME_COUNTRY_NAME);
  assert.include(SITE_DESCRIPTION, HOME_COUNTRY_NAME);

  // The country code and its name must name the same country, or the PostalAddress contradicts
  // the human-readable location every other surface prints.
  assert.strictEqual(HOME_COUNTRY, "PL");
  assert.strictEqual(HOME_COUNTRY_NAME, "Poland");

  // knowsAbout is published as JSON-LD, so it must be a non-empty set of distinct topics.
  assert.isTrue(KNOWS_ABOUT.length > 0);
  assert.strictEqual(new Set(KNOWS_ABOUT).size, KNOWS_ABOUT.length);
});

it("the vocabulary locales name one locale per supported language", () => {
  // og:locale and og:locale:alternate are validated against a closed vocabulary, so a language
  // declared without a locale would publish an invalid tag on every page in that language.
  for (const language of ["en", "pl"] as const) {
    assert.strictEqual(OPEN_GRAPH_LOCALES[language].length > 0, true);
    assert.strictEqual(SITE_LANGUAGE_NAMES[language].length > 0, true);
  }
  assert.deepStrictEqual(Object.keys(OPEN_GRAPH_LOCALES), Object.keys(SITE_LANGUAGE_NAMES));
});
