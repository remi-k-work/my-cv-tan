import { assert, it } from "@effect/vitest";
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
import { contactHandler, educationHandler, experienceHandler, homeHandler, llmsFullTxtHandler, llmsTxtHandler } from "@/features/markdown/services/handlers";
import { robotsHandler } from "@/features/meta/services/robots";
import { sitemapHandler } from "@/features/meta/services/sitemap";
import { absoluteUrl, experiencePath } from "@/features/meta/domain/urls";
import { BRANDED_TITLE, HOME_URL } from "@/features/meta/domain/site";
import { STATIC_PAGES } from "@/features/meta/domain/pages";
import { INDEXABLE_ROBOTS, NOINDEX_FOLLOW } from "@/domain/http";
import { HOME_PATH } from "@/domain/constants";
import { sampleEducation, sampleExperience, stablePageTitles } from "@/features/meta/domain/__tests__/fixtures";
import type { MatchChain, PageHead, RouteStatus } from "@/features/meta/domain/models";
import type { PreferredLanguage } from "@/domain/models";

interface HeadRoute {
  readonly options: {
    readonly head?: (context: never) => unknown;
  };
}

interface HeadInput {
  readonly loaderData: unknown;
  readonly params?: { readonly slug?: string };
  readonly matchStatus?: RouteStatus;
  readonly preferredLanguage?: PreferredLanguage;
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
      randomPageTitles: stablePageTitles,
      stablePageTitles,
      experienceList: [sampleExperience],
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
    loaderData: { type: "item", experience: sampleExperience },
    params: { slug: sampleExperience.slug },
  });

  assert.strictEqual(metaContent(detail, "property", "og:type"), "article");
  assert.strictEqual(metaContent(detail, "property", "og:locale"), "pl_PL");
  assert.deepStrictEqual(
    detail.links.find(({ rel }) => rel === "canonical"),
    {
      rel: "canonical",
      href: absoluteUrl(experiencePath(sampleExperience.slug)),
    }
  );
});

it("static HTML routes connect their loader data to the correct localized page heads", async () => {
  const education = await headOf(EducationRoute, {
    loaderData: { randomPageTitles: stablePageTitles, stablePageTitles, educationList: sampleEducation },
  });
  const contact = await headOf(ContactRoute, {
    loaderData: { randomPageTitles: stablePageTitles, stablePageTitles },
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
      randomPageTitles: stablePageTitles,
      stablePageTitles,
      experienceList: [sampleExperience],
    },
    params: { slug },
    matchStatus: "error",
  });

  assert.strictEqual(metaContent(head, "name", "robots"), NOINDEX_FOLLOW);
  assert.deepStrictEqual(head.links, [{ rel: "canonical", href: absoluteUrl(experiencePath(slug)) }]);
  assert.notInclude(JSON.stringify(head), sampleExperience.role);
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

it("every public machine-readable route is bound to its implemented GET handler", () => {
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
    assert.strictEqual(get, handler);
  }
});
