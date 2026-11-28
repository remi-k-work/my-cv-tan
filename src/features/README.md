# Feature architecture

This directory holds the app's features. Each feature owns one reason to change, and the
machine-readable surfaces of the site are split so that no feature reaches into another's domain.

`seo-geo` is a **concern label**, not a folder. It names the cross-surface behaviour these features
share (the HTML head, structured data, Markdown twins, robots/sitemap and AI indexes all describing
one page identity), and the integration tests that compare those surfaces. There is deliberately no
`src/features/seo-geo`.

## Layer map

```text
src/
  domain/            shared site vocabulary — no feature imports
    site.ts          origin, names, descriptions, profiles, images, degraded copy
    urls.ts          canonical URL math, slug codec, language pins
    pages.ts         STATIC_PAGES catalogue + staticPageCopy
    discovery.ts     llms/robots/sitemap/downloadable-document catalogue
    links.ts         LinkTag, Link header builders, representation links
    constants.ts     languages, page paths, snippet length
    models.ts        PagePath, PageTitles, PageHighlights, PageIdentity, Translate, ImageFacts, EducationList
    http.ts          robots/cache directives

  lib/               cross-cutting runtime helpers
    http-response.ts document/txt/sitemap response envelopes + header policy

  features/
    experience/      experience data, UI, and its SEO projection (domain/seo.ts)
    jsonld/          schema.org graph types, serializer, node builders, page graphs
    document-head/   HTML document head only: social tags, page/root/route heads, fallback heads
    discovery/       crawl + AI discovery outputs: robots, sitemap, llms.txt, llms-full.txt
    markdown/        Markdown representation: twins, catalogue, formatting, .md responses
    ...              captcha, contact-me, data, education, modals, typewriter
```

## Dependency directions

The arrows point at what a feature may import:

```text
src/domain (shared vocabulary)
   ↑
experience/domain/seo
   ↑                    ↑
jsonld/domain      markdown/domain
   ↑                    ↑
document-head/domain  discovery/domain/llms
                        ↑
                   discovery/services
```

Allowed:

- `markdown` → `src/domain`, `experience/domain`, `src/lib/http-response`
- `jsonld` → `src/domain`, `experience/domain`
- `document-head` → `src/domain`, `experience/domain`, `jsonld/domain`
- `discovery` → `src/domain`, `experience/domain`, `markdown/domain`, `src/lib/http-response`
- `experience` → `src/domain`
- routes / UI → feature public modules
- `src/domain` → **no** feature imports

Forbidden:

- `markdown` → `document-head`, `jsonld`, `discovery`, `education`
- `document-head` → `markdown`, `discovery`, `education`
- `jsonld` → `document-head`, `markdown`, `discovery`, `education`
- `discovery` → `document-head`, `jsonld`, `education`
- `data` → `education`
- `src/domain` → `src/features`

`discovery → markdown` is intentional and one-way: `llms-full.txt` embeds the Markdown bodies, so
`discovery` composes `markdown`. `markdown` must never import `discovery`; anything it needs from the
discovery vocabulary comes from `src/domain/discovery`.

`EducationList` is shared by the data decoder, education UI, Markdown twin, document head, JSON-LD
graph and discovery output, so its schema lives in `src/domain/models.ts`; those consumers must not
import the education feature's domain.

## Litmus test

- Delete `document-head`: only HTML head routes break; `markdown`, `jsonld` and `discovery` still stand.
- Delete `jsonld`: only `document-head` breaks.
- Delete `markdown`: only `discovery`'s llms surface breaks — an explicit downstream dependency, not
  a cycle.

## Enforcement and tests

- `src/domain/__tests__/boundaries.test.ts` scans every production module and fails on the forbidden
  edges above. Production means everything outside `__tests__` directories and `*.test.ts(x)`.
- Tests are exempt: comparing two features' output is what an integration test is for. Cross-surface
  tests live in `src/features/__tests__`, and their sample records/copy live in
  `src/testing/fixtures.ts` (test-only; no production module imports it).
- A feature's own tests and test helpers live beside it, and readers stay with the format they read:
  JSON-LD graph readers in `jsonld/domain/__tests__`, meta-tag readers in `document-head/domain/__tests__`.

## Adding a new surface

1. Put shared data/copy in `src/domain` first, never in a feature another feature must import.
2. Add the output as its own feature under `src/features/<output>/`.
3. Keep the production import graph pointing in the allowed directions; update the `FORBIDDEN` map in
   the boundary test only if a genuine new edge is agreed.
4. Add a reader/helper with the format, and a cross-surface test in `src/features/__tests__` when the
   new output must agree with an existing one.
