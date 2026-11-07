// services, features, and other libraries
import { assert, it } from "@effect/vitest";
import { Option, Schema } from "effect";

// domain
import { Experience } from "../models";

const decodeExperience = Schema.decodeUnknownOption(Experience);

const experience = (slug: string) => ({
  type: "p",
  slug,
  year: "2026",
  role: "Developer",
  company: "Sample Co",
  txt: "Built software.",
  imageName: "01",
  skillsUsed: ["TypeScript"],
});

it("rejects route slugs that URL parsing would normalize to another page", () => {
  for (const slug of [".", ".."]) {
    assert.deepStrictEqual(decodeExperience(experience(slug)), Option.none());
  }

  assert.isTrue(Option.isSome(decodeExperience(experience("..."))));
});

it("rejects slugs reserved by static routes or the Markdown twin suffix", () => {
  for (const slug of [
    "education",
    "CONTACT",
    "exp",
    "llms.txt",
    "llms-full.txt",
    "robots.txt",
    "sitemap.xml",
    "report.md",
    "REPORT.MD",
  ]) {
    assert.deepStrictEqual(decodeExperience(experience(slug)), Option.none(), `${slug} is reserved`);
  }

  for (const slug of ["education-tools", "index", "report.mdx", "api.captcha", "api.rpc.data", "C# .NET", "a/b"]) {
    assert.isTrue(Option.isSome(decodeExperience(experience(slug))), `${slug} remains a valid slug`);
  }
});

it("rejects Markdown suffix collisions even when a slug contains line breaks", () => {
  for (const slug of ["report\n.md", "report\u2028.md"]) {
    assert.deepStrictEqual(decodeExperience(experience(slug)), Option.none(), `${JSON.stringify(slug)} is reserved`);
  }
});

it("rejects unpaired surrogates that URL encoding cannot represent", () => {
  for (const slug of ["\uD800", "\uDC00"]) {
    assert.deepStrictEqual(decodeExperience(experience(slug)), Option.none());
  }

  assert.isTrue(Option.isSome(decodeExperience(experience("👩‍💻"))));
});
