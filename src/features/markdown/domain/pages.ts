// --- Static-page Markdown twins ---
//
// Every static twin shares the same spine: identity block (mirrors <head> meta), visible intro,
// page-specific sections, and a Pages section that points at the rest of the graph. Declared once
// so no twin can forget the intro-block-escaping or the graph-exit invariants.

// services, features, and other libraries
import { Array } from "effect";
import { msg } from "gt-tanstack-start";
import { escapeMd, escapeMdInline } from "./text";
import { frontmatter, mdBody, mdBulletList, mdDocument, mdDocumentLinks, mdEmptyMarker, mdFact, mdHeading, mdProfileLinks, mdQuote, mdTitledSection, twinIdentity, twinLink } from "./blocks";
import { experienceLines } from "./experience";
import { twinIndexLinks } from "./document-graph";
import { staticPageCopy, CONTACT_PATH, EDUCATION_PATH, HOME_PATH } from "@/features/meta/domain/static-pages";
import { absoluteUrl } from "@/features/meta/domain/url";

// types
import type { PagePath, PageTitles, PreferredLanguage, Translate } from "@/domain/models";
import type { ContactMdInput, EducationMdInput, HomeMdInput } from "./models";
import type { EducationList } from "@/features/education/domain/models";
import type { StaticPageCopy } from "@/features/meta/domain/static-pages";

// constants
import { SOCIAL_PROFILES } from "@/features/meta/domain/constants";
import { DOWNLOADABLE_DOCUMENTS } from "./constants";

// The contact twin publishes each profile label beside its URL, from the same labeled declaration
// the JSON-LD sameAs edges, the root rel="me" links and llms.txt read. The localized base line joins
// the shared profile table, and every translated label is escaped: dictionary copy is authored data
// like any other, and an inline value carrying "_" or "*" would otherwise fabricate emphasis from a
// bullet prefix. `mdFact` escapes both halves itself, so no caller pre-escapes here.
const profileLinks = (translate: Translate) => [
  ...mdProfileLinks(SOCIAL_PROFILES),
  mdFact(translate(msg("Base")), translate(msg("Rzeszów, Poland"))),
];

// Shared opening of a page twin: the identity block (title, description, author, canonical,
// language) mirrors <head> meta through twinIdentity, plus a machine-classifiable entry type.
// Copy comes from staticPageCopy — the exact resolution the HTML head uses — so the .md and HTML
// meta can never drift. The quote carries the authored description as a pull-quote an AI indexer
// can cite without parsing body prose.
const pageOpening = (copy: StaticPageCopy) => [
  frontmatter({
    ...twinIdentity({
      title: copy.seoTitle,
      description: copy.description,
      canonical: copy.canonical,
      preferredLanguage: copy.preferredLanguage,
    }),
    // Machine-classifiable entry type so AI indexers can bucket the document without reading the body
    type: copy.type,
  }),
  mdHeading(1, copy.pageName),
  mdQuote(copy.description),
];

// The schools, nested one level below a translated parent section. A school name is a content entry,
// not a section of the document, so it belongs at level 3: nesting is also what lets a parser attach
// the prose description to the right school.
//
// An empty list yields the explicit "no entries" marker instead of a bare section heading, which
// would read as truncated content to an AI parser. `mdTitledSection` always emits an H2; the empty
// marker short-circuits that so no heading is published without entries beneath it.
const schoolSections = (educationList: EducationList, translate: Translate) =>
  mdTitledSection(
    translate(msg("Education")),
    Array.match(educationList, {
      onEmpty: () => mdEmptyMarker(translate),
      onNonEmpty: (schools) =>
        mdBody(
          Array.map(schools, ({ name, year, location, info }) =>
            mdBody([mdHeading(3, name), mdBulletList([mdFact(translate(msg("Years")), year), mdFact(translate(msg("Location")), location)]), escapeMd(info)])
          )
        ),
    })
  );

// Downloadable documents advertised to AI systems: the shared DOWNLOADABLE_DOCUMENTS list is the
// same one the English llms.txt index prints, so a document can never reach one surface only.
// `label` doubles as the GT dictionary key, so the translated twin prints the dictionary's own label,
// escaped inside the link label by the one rule translatedLink owns.
const documentsSection = (translate: Translate) => mdTitledSection(translate(msg("Documents")), mdDocumentLinks(DOWNLOADABLE_DOCUMENTS, translate));

// The contact channels, named by the page's own canonical so a reader of the twin can reach the
// interactive document, beside the profiles and base location every other surface already publishes.
// `escapeMdInline` neutralizes both the translated label and the parenthetical so dictionary copy
// cannot inject Markdown structure into the line.
const contactChannels = (canonical: string, translate: Translate) =>
  mdTitledSection(
    translate(msg("Channels")),
    mdBulletList([
      `${escapeMdInline(translate(msg("Contact Form")))}: ${canonical} (${escapeMdInline(translate(msg("same page in HTML")))})`,
      ...profileLinks(translate),
    ])
  );

// Every static twin ends by pointing at the documents a reader has not seen yet. A twin is a leaf in
// the HTML navigation, so without this it is a dead end for a crawler that resolved one page of the
// document graph. `twinIndexLinks` excludes the linking page itself so a twin never advertises
// itself — a dead-end signal to AI crawlers.
const pagesSection = (copy: StaticPageCopy, translate: Translate) => mdTitledSection(translate(msg("Pages")), twinIndexLinks(copy, translate));

// The spine all three static twins share: resolve the copy the HTML head reads the same way, emit the
// identity block and the escaped intro, then the page's own sections, then the graph exit.
//
// Declared once so the two invariants that hold across the whole family — the intro is block-escaped
// and every document ends with its Pages section — cannot be dropped by a fourth twin that forgets
// one of them. `sections` is the only per-page input beside the copy key itself. `escapeMd` runs on
// the intro because authored prose is data: it is neutralized before it can fabricate headings,
// lists or quotes inside the twin.
const staticTwinDocument = (pageTitles: PageTitles, pagePath: PagePath, preferredLanguage: PreferredLanguage, translate: Translate, sections: ReadonlyArray<string>) => {
  const copy = staticPageCopy(pageTitles, pagePath, preferredLanguage);

  return mdDocument([...pageOpening(copy), escapeMd(copy.intro), ...sections, pagesSection(copy, translate)]);
};

export const buildHomeMd = ({ pageTitles, experienceList, preferredLanguage, translate }: HomeMdInput) =>
  staticTwinDocument(pageTitles, HOME_PATH, preferredLanguage, translate, [
    // The reader is already inside a Markdown document, so the entries navigate to sibling twins
    // rather than out to the HTML pages an index cites (see experienceLines).
    mdTitledSection(translate(msg("Experience")), experienceLines({ experienceList, type: "e", translate, preferredLanguage, entry: "twin" })),
    mdTitledSection(translate(msg("Portfolio Projects")), experienceLines({ experienceList, type: "p", translate, preferredLanguage, entry: "twin" })),
  ]);

export const buildEducationMd = ({ pageTitles, educationList, preferredLanguage, translate }: EducationMdInput) =>
  staticTwinDocument(pageTitles, EDUCATION_PATH, preferredLanguage, translate, [schoolSections(educationList, translate), documentsSection(translate)]);

export const buildContactMd = ({ pageTitles, preferredLanguage, translate }: ContactMdInput) =>
  staticTwinDocument(pageTitles, CONTACT_PATH, preferredLanguage, translate, [contactChannels(absoluteUrl(CONTACT_PATH), translate)]);
