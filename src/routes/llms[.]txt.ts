// oxlint-disable effecttsgo/async-function

// tanstack
import { createFileRoute } from "@tanstack/react-router";

// services, features, and other libraries
import { Array, Effect, Option, pipe } from "effect";
import { RuntimeServer } from "@/lib/runtime-server";
import { Data } from "@/features/data/services/data";
import { excerpt } from "@/features/experience/domain";
import { escapeMdInline } from "@/features/markdown/domain";

// constants
import { CONTACT_MD_HREF, DESCRIPTION, EDUCATION_MD_HREF, HOME_MD_HREF, META_DESCRIPTION_LENGTH, SITE_NAME, SITE_URL, SOCIAL_LINKS, TITLE } from "@/features/meta/domain";

// types
import type { Experience } from "@/features/experience/domain";

// Machine-readable site index for AI systems (GEO).
// Every entry points at a `.md` twin (never raw HTML): fetch one Markdown page at a time.
// Link labels are escaped so future roles/companies containing `[`, `]` or `*`
// can never break the Markdown link syntax (slugs themselves are URL-safe).
const experienceLine = ({ slug, role, company, year, txt }: Experience) =>
  `- [${escapeMdInline(`${role} at ${company} (${year})`)}](${SITE_URL}/${slug}.md): ${escapeMdInline(excerpt(txt, 140))}`;

const buildLlmsTxt = (experiences: ReadonlyArray<Experience>) =>
  pipe(
    experiences,
    Array.filter(({ type }) => type === "e"),
    Array.map(experienceLine),
    Array.join("\n"),
    (workLines) =>
      pipe(
        experiences,
        Array.filter(({ type }) => type === "p"),
        Array.map(experienceLine),
        Array.join("\n"),
        (projectLines) =>
          [
            `# ${SITE_NAME}`,
            ``,
            `> ${excerpt(TITLE, META_DESCRIPTION_LENGTH)}`,
            ``,
            `${DESCRIPTION}`,
            ``,
            `Self-taught web developer portfolio. Every page below has a machine-readable Markdown twin; fetch one linked \`.md\` page at a time.`,
            ``,
            `## Pages`,
            ``,
            `- [Home](${SITE_URL}${HOME_MD_HREF}): portfolio overview with experience and project lists.`,
            `- [Education & Certificates](${SITE_URL}${EDUCATION_MD_HREF}): schools, courses and certificates.`,
            `- [Contact](${SITE_URL}${CONTACT_MD_HREF}): contact form, location and social profiles.`,
            ``,
            `## Work Experience`,
            ``,
            workLines === "" ? `_No entries._` : workLines,
            ``,
            `## Portfolio Projects`,
            ``,
            projectLines === "" ? `_No entries._` : projectLines,
            ``,
            `## Documents`,
            ``,
            `- CV (English): ${SITE_URL}/my-cv.pdf`,
            `- CV (Polish): ${SITE_URL}/my-cv-pl.pdf`,
            `- Certificates: ${SITE_URL}/my-certificates.pdf`,
            ``,
            `## Profiles`,
            ``,
            ...SOCIAL_LINKS.map((link) => `- ${link}`),
            ``,
            `## Notes for AI systems`,
            ``,
            `- Append \`?lang=pl\` to any \`.md\` URL for the Polish variant (default is English). Cookie and Accept-Language are also respected.`,
            `- Always cite the clean canonical HTML URL from each document's frontmatter (\`canonical:\`), not the \`.md\` URL.`,
            `- Structured data (JSON-LD) is embedded in every page head.`,
            ``,
          ].join("\n")
      )
  );

const main = Effect.gen(function* () {
  const data = yield* Data;

  const maybeList = yield* data.experienceList(Option.some("en"), Option.none());
  if (Option.isNone(maybeList)) yield* Effect.logError("[LLMS.TXT]: experienceList decode failed, emitting pages only");

  return buildLlmsTxt(Option.getOrElse(maybeList, () => []));
});

export const Route = createFileRoute("/llms.txt")({
  server: {
    handlers: {
      GET: async () => {
        return new Response(await RuntimeServer.runPromise(main), {
          headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600" },
        });
      },
    },
  },
});
