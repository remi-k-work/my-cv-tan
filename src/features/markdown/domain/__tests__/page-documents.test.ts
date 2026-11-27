import { assert, it } from "@effect/vitest";
import { STATIC_PAGE_PATHS } from "@/domain/pages";
import { sampleEmployment, stablePageTitles } from "@/testing/fixtures";
import { SOURCE_CONTEXT } from "../models";
import { buildContactMd, buildEducationMd, buildHomeMd, buildPageDocument } from "../twins";
import type { PagePath } from "@/domain/models";
import type { MarkdownTwin } from "../models";

const content = {
  pageTitles: stablePageTitles,
  experienceList: [sampleEmployment],
  educationList: [{ name: "Example School", year: "2020", location: "Poland", info: "Studied interaction design." }],
} as const;

it("the shared page dispatcher selects the same pure builder for every catalogue page", () => {
  const expected = {
    "/": buildHomeMd({ pageTitles: content.pageTitles, experienceList: content.experienceList, ...SOURCE_CONTEXT }),
    "/education": buildEducationMd({ pageTitles: content.pageTitles, educationList: content.educationList, ...SOURCE_CONTEXT }),
    "/contact": buildContactMd({ pageTitles: content.pageTitles, ...SOURCE_CONTEXT }),
  } satisfies Record<PagePath, MarkdownTwin>;

  for (const pagePath of STATIC_PAGE_PATHS) {
    assert.deepStrictEqual(buildPageDocument(pagePath, content, SOURCE_CONTEXT), expected[pagePath]);
  }
});
