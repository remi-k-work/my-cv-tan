// Feature boundaries, enforced against the source rather than trusted to review.
//
// The reorganisation split one `meta` grab-bag into `document-head`, `jsonld`, `discovery` and `markdown`,
// each owning one output. The value of that split is the direction of the dependencies: if any one
// feature can reach back into another's domain, the responsibilities blur again. Nothing in the type
// checker prevents it, so this test reads the imports out of every production module and fails on a
// forbidden edge.
//
// Only production modules are scanned: a test is allowed to cross every boundary, because comparing
// two features' outputs is exactly what an integration test is for. The cross-surface integration
// tests live at `src/features/__tests__`.

import { assert, it } from "@effect/vitest";
// services, features, and other libraries
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join, relative, sep } from "node:path";

const SOURCE_ROOT = join(process.cwd(), "src");

// Test files and test helpers may import across every boundary; only production source is bound.
const isTestFile = (path: string) => path.includes(`${sep}__tests__${sep}`) || /\.test\.tsx?$/.test(path);

const productionFiles = (dir: string): ReadonlyArray<string> =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return productionFiles(path);
    return /\.tsx?$/.test(entry.name) && !isTestFile(path) ? [path] : [];
  });

// Named, default, namespace, type-only imports and re-exports all end in `from "specifier"`;
// side-effect and dynamic imports are the two forms that do not.
const SPECIFIERS = [/\bfrom\s+["']([^"']+)["']/gu, /\bimport\s+["']([^"']+)["']/gu, /\bimport\(\s*["']([^"']+)["']\s*\)/gu];

const specifiersOf = (source: string): ReadonlyArray<string> => SPECIFIERS.flatMap((pattern) => [...source.matchAll(pattern)].map((match) => match[1]!));

// An import is only an edge if it lands inside this repository; bare package specifiers are left out.
const resolveSpecifier = (file: string, specifier: string): string | null => {
  if (specifier.startsWith("@/")) return join(SOURCE_ROOT, specifier.slice(2));
  if (specifier.startsWith(".")) return join(dirname(file), specifier);
  return null;
};

const slashed = (path: string) => relative(SOURCE_ROOT, path).split(sep).join("/");

// The owning feature of a module, or null for shared code (`src/domain`, `src/routes`, ...).
const featureOf = (modulePath: string): string | null => /^features\/([^/]+)\//.exec(slashed(modulePath))?.[1] ?? null;

// The shared vocabulary must not reach back into the features that build on it.
const isSharedDomain = (modulePath: string) => slashed(modulePath).startsWith("domain/");

// One entry per forbidden edge, not per mirror pair: `document-head -> jsonld` is fine, `jsonld -> document-head` is not.
const FORBIDDEN: Readonly<Record<string, ReadonlyArray<string>>> = {
  markdown: ["document-head", "jsonld", "discovery", "education"],
  "document-head": ["markdown", "discovery", "education"],
  jsonld: ["document-head", "markdown", "discovery", "education"],
  discovery: ["document-head", "jsonld", "education"],
  data: ["education"],
};

const files = productionFiles(SOURCE_ROOT);

const violations = files.flatMap((file) =>
  specifiersOf(readFileSync(file, "utf8")).flatMap((specifier) => {
    const resolved = resolveSpecifier(file, specifier);
    if (resolved === null) return [];

    const source = slashed(file);
    const target = featureOf(resolved);

    if (isSharedDomain(file) && slashed(resolved).startsWith("features/")) {
      return [`${source} imports ${slashed(resolved)}: src/domain must not depend on src/features`];
    }

    const owner = featureOf(file);
    if (owner !== null && target !== null && FORBIDDEN[owner]?.includes(target)) {
      return [`${source} imports ${specifier}: ${owner} must not depend on ${target}`];
    }

    return [];
  })
);

it("no production module crosses a forbidden feature boundary", () => {
  // The scan has to be finding real modules, or an empty `violations` proves nothing.
  assert.isAbove(files.length, 100);
  assert.includeMembers(
    [...new Set(files.map(featureOf).filter((feature): feature is string => feature !== null))],
    Object.keys(FORBIDDEN)
  );

  assert.deepStrictEqual(violations, []);
});
