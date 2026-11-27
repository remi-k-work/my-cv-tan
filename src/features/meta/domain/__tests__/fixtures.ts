// The inputs and meta readers the meta feature's unit tests share.
//
// The sample records and the meta-tag reader used to be spelled out separately in every test file,
// so a fix in one copy left the others behind. They live here now: one definition per value, and
// the reader parses back exactly what a browser would take out of a rendered <meta> element.
// JSON-LD graph readers live with the `jsonld` feature, beside the serializer they read.

// services, features, and other libraries
import { Option, Schema, pipe } from "effect";

// types
import type { PageTitles, PreferredLanguage } from "@/domain/models";
import type { EducationList } from "@/features/education/domain/models";
import type { Experience } from "@/features/experience/domain/models";
import type { MetaTag, PageHead } from "../models";

// constants
export const LANGUAGE: PreferredLanguage = "en";

export const sampleExperience: Experience = {
  type: "p",
  slug: "sample-role",
  year: "Mar 2026",
  role: "Full-Stack Developer",
  company: "Sample Co",
  txt: "Built things with care.",
  gitHubLink: "https://github.com/example/repo",
  imageName: "01",
  skillsUsed: ["TypeScript", "React"],
};

export const sampleEducation: EducationList = [{ name: "Pratt Institute", year: "• 2002 — 2004 •", location: "New York, US", info: "Interactive Media." }];

export const stablePageTitles: PageTitles = {
  "/": { eyebrow: "Home", heading: "Stable home title", intro: "Stable home description." },
  "/education": { eyebrow: "Education", heading: "Stable education title", intro: "Stable education description." },
  "/contact": { eyebrow: "Contact", heading: "Stable contact title", intro: "Stable contact description." },
};

const decodeMetaTags = Schema.decodeUnknownOption(Schema.fromJsonString(Schema.Array(Schema.Record(Schema.String, Schema.String))));

// Meta tags are a flat union, so a JSON round trip reads them back as the plain records the
// assertions compare against; a payload that fails the decode reads as an empty list, so a
// regression fails loudly instead of quietly reading undefined off a cast
export const metaTagsOf = (tags: ReadonlyArray<MetaTag>): ReadonlyArray<Record<string, string>> =>
  pipe(
    decodeMetaTags(JSON.stringify(tags)),
    Option.getOrElse<ReadonlyArray<Record<string, string>>>(() => [])
  );

export const metaOf = (head: PageHead) => metaTagsOf(head.meta ?? []);

export const tagContent = (tags: ReadonlyArray<Record<string, string>>, key: "property" | "name", value: string) =>
  tags.find((tag) => tag[key] === value)?.content;