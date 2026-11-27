// The meta-tag reader the meta feature's unit tests share.
//
// The reader parses back exactly what a browser would take out of a rendered <meta> element, so a
// test compares the flat tag union against the plain records the document publishes. Shared sample
// records and copy live in `@/testing/fixtures`; JSON-LD graph readers live with the `jsonld`
// feature, beside the serializer they read.

// services, features, and other libraries
import { Option, Schema, pipe } from "effect";

// types
import type { PreferredLanguage } from "@/domain/models";
import type { MetaTag, PageHead } from "../models";

export const LANGUAGE: PreferredLanguage = "en";

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