import { assert, it } from "@effect/vitest";
import { isRedirect } from "@tanstack/react-router";
import { Route as RootRoute } from "@/routes/__root";
import { Route as IndexRoute } from "@/routes/{-$slug}";
import { Route as EducationRoute } from "@/routes/education";
import { Route as ContactRoute } from "@/routes/contact";
import { Route as HomeMdRoute } from "@/routes/index[.]md";
import { Route as EducationMdRoute } from "@/routes/education[.]md";
import { Route as ContactMdRoute } from "@/routes/contact[.]md";
import { Route as ExperienceMdRoute } from "@/routes/{$slug}[.]md";
import { Route as LlmsTxtRoute } from "@/routes/llms[.]txt";
import { Route as LlmsFullTxtRoute } from "@/routes/llms-full[.]txt";
import { Route as RobotsRoute } from "@/routes/robots[.]txt";
import { Route as SitemapRoute } from "@/routes/sitemap[.]xml";
import { Route as LegacyExperienceRoute } from "@/routes/exp.$";
import { Route as LegacyExperienceIndexRoute } from "@/routes/exp.index";
import { contactHandler, educationHandler, experienceHandler, homeHandler } from "@/features/markdown/services/handlers";
import { llmsFullTxtHandler, llmsTxtHandler, robotsHandler, sitemapHandler } from "@/features/discovery/services/handlers";
import { absoluteUrl, experiencePath } from "@/domain/urls";
import { BRANDED_TITLE, HOME_URL } from "@/domain/site";
import { STATIC_PAGES } from "@/domain/pages";
import { INDEXABLE_ROBOTS, NOINDEX_FOLLOW } from "@/domain/http";
import { HOME_PATH } from "@/domain/constants";
import { pageHighlights, sampleEducation, samplePortfolio, stablePageTitles } from "@/testing/fixtures";
import type { PageHead } from "@/features/document-head/domain/models";
import type { MatchChain, RouteStatus } from "@/features/document-head/domain/route-head";

interface HeadRoute {
  readonly options: {
    readonly head?: (context: never) => unknown;
  };
}

interface HeadInput {
  readonly loaderData: unknown;
  readonly params?: { readonly slug?: string };
  readonly matchStatus?: RouteStatus;
  readonly preferredLanguage?: unknown;
}

const headOf = async (route: HeadRoute, { loaderData, params = {}, matchStatus = "success", preferredLanguage = "pl" }: HeadInput): Promise<PageHead> => {
  const head = route.options.head;
  if (head === undefined) throw new Error("Route must declare head()");

  const matches: MatchChain = [{ loaderData: { preferredLanguage }, status: "success" }, { status: matchStatus }];

  // Route callbacks receive a large TanStack context; these tests exercise only the fields the
  // application declared it reads, without mocking the head builders themselves.
  return (await head({ loaderData, matches, match: { status: matchStatus }, params } as never)) as PageHead;
};

const metaContent = (head: PageHead, key: "name" | "property", value: string) => {
  const tag = head.meta.find(
    (candidate) =>
      (key === "name" && "name" in candidate && candidate.name === value) || (key === "property" && "property" in candidate && candidate.property === value)
  );
  return tag !== undefined && "content" in tag ? tag.content : undefined;
};

it("the index route builds home and detail heads from their respective loader payloads", async () => {
  const home = await headOf(IndexRoute, {
    loaderData: {
      type: "list",
      randomPageHighlights: pageHighlights,
      stablePageTitles,
      experienceList: [samplePortfolio],
    },
  });

  assert.strictEqual(metaContent(home, "property", "og:locale"), "pl_PL");
  assert.strictEqual(metaContent(home, "name", "robots"), INDEXABLE_ROBOTS);
  assert.deepStrictEqual(
    home.links.find(({ rel }) => rel === "canonical"),
    { rel: "canonical", href: HOME_URL }
  );
  assert.include(JSON.stringify(home.meta), JSON.stringify({ title: BRANDED_TITLE(STATIC_PAGES[HOME_PATH].copy.pl.title) }));

  const detail = await headOf(IndexRoute, {
    loaderData: { type: "item", experience: samplePortfolio },
    params: { slug: samplePortfolio.slug },
  });

  assert.strictEqual(metaContent(detail, "property", "og:type"), "article");
  assert.strictEqual(metaContent(detail, "property", "og:locale"), "pl_PL");
  assert.deepStrictEqual(
    detail.links.find(({ rel }) => rel === "canonical"),
    {
      rel: "canonical",
      href: absoluteUrl(experiencePath(samplePortfolio.slug)),
    }
  );
});

it("static HTML routes connect their loader data to the correct localized page heads", async () => {
  const education = await headOf(EducationRoute, {
    loaderData: { randomPageHighlights: pageHighlights, stablePageTitles, educationList: sampleEducation },
  });
  const contact = await headOf(ContactRoute, {
    loaderData: { randomPageHighlights: pageHighlights, stablePageTitles },
  });

  assert.strictEqual(metaContent(education, "property", "og:locale"), "pl_PL");
  assert.deepStrictEqual(
    education.links.find(({ rel }) => rel === "canonical"),
    { rel: "canonical", href: absoluteUrl("/education") }
  );
  assert.include(JSON.stringify(education.scripts), "Pratt Institute");

  assert.strictEqual(metaContent(contact, "property", "og:locale"), "pl_PL");
  assert.deepStrictEqual(
    contact.links.find(({ rel }) => rel === "canonical"),
    { rel: "canonical", href: absoluteUrl("/contact") }
  );
  assert.include(JSON.stringify(contact.scripts), "ContactPoint");
});

it("the detail route derives its degraded canonical from current params, never stale loader data", async () => {
  const slug = "role (senior) & more";
  const head = await headOf(IndexRoute, {
    loaderData: {
      type: "list",
      randomPageHighlights: pageHighlights,
      stablePageTitles,
      experienceList: [samplePortfolio],
    },
    params: { slug },
    matchStatus: "error",
  });

  assert.strictEqual(metaContent(head, "name", "robots"), NOINDEX_FOLLOW);
  assert.deepStrictEqual(head.links, [{ rel: "canonical", href: absoluteUrl(experiencePath(slug)) }]);
  assert.notInclude(JSON.stringify(head), samplePortfolio.role);
});

it("route heads fall back to English when the root locale is unsupported", async () => {
  const head = await headOf(ContactRoute, {
    loaderData: { randomPageHighlights: pageHighlights, stablePageTitles },
    preferredLanguage: "de",
  });

  assert.strictEqual(metaContent(head, "property", "og:locale"), "en_US");
  assert.strictEqual(metaContent(head, "property", "og:locale:alternate"), "pl_PL");
  assert.strictEqual(metaContent(head, "name", "description"), STATIC_PAGES["/contact"].copy.en.description);
});

it("legacy experience routes permanently redirect to the canonical home URL", () => {
  for (const route of [LegacyExperienceRoute, LegacyExperienceIndexRoute]) {
    // The two route generics have different loader unions; both legacy loaders are synchronous and argument-free here.
    const loader = route.options.loader as unknown as ((context: never) => unknown) | undefined;
    if (loader === undefined) throw new Error("Legacy route must declare a loader");

    let thrown: unknown;
    try {
      loader({} as never);
    } catch (error) {
      thrown = error;
    }

    assert.isTrue(isRedirect(thrown));
    if (!isRedirect(thrown)) continue;
    assert.strictEqual(thrown.status, 301);
    const options = thrown.options as { readonly to?: unknown; readonly params?: unknown };
    assert.strictEqual(options.to, "/{-$slug}");
    assert.deepStrictEqual(options.params, { slug: undefined });
  }
});

it("the root route publishes response headers for the language negotiated by its loader", async () => {
  const headers = RootRoute.options.headers;
  if (headers === undefined) throw new Error("Root route must declare headers()");

  const result = await headers({
    matches: [{ loaderData: { preferredLanguage: "pl" }, status: "success" }],
  } as never);

  assert.strictEqual(result?.["Content-Language"], "pl");
  assert.strictEqual(result?.Vary, "Cookie, Accept-Language");
  assert.strictEqual(result?.["X-Content-Type-Options"], "nosniff");
  assert.include(result?.Link ?? "", "https://www.remiforge.dev/llms.txt");
});

it("every public machine-readable route supports GET and HEAD through the same handler", () => {
  const bindings = [
    [HomeMdRoute, homeHandler],
    [EducationMdRoute, educationHandler],
    [ContactMdRoute, contactHandler],
    [ExperienceMdRoute, experienceHandler],
    [LlmsTxtRoute, llmsTxtHandler],
    [LlmsFullTxtRoute, llmsFullTxtHandler],
    [RobotsRoute, robotsHandler],
    [SitemapRoute, sitemapHandler],
  ] as const;

  for (const [route, handler] of bindings) {
    const handlers: unknown = route.options.server?.handlers;
    const get = typeof handlers === "object" && handlers !== null && "GET" in handlers ? handlers.GET : undefined;
    const head = typeof handlers === "object" && handlers !== null && "HEAD" in handlers ? handlers.HEAD : undefined;
    assert.strictEqual(get, handler);
    assert.strictEqual(head, handler);
  }
});
