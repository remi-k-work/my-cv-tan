// services, features, and other libraries
import { msg } from "gt-tanstack-start";
import { Array } from "effect";
import { STATIC_PAGES, STATIC_PATHS, HOME_PATH } from "@/features/meta/domain/static-pages";
import { escapeMdInline } from "./text";

// types
import type { PreferredLanguage, Translate } from "@/domain/models";
import type { StaticPageCopy } from "@/features/meta/domain/static-pages";

// constants
import { AI_INDEX_MARKDOWN_LINKS, LLMS_TXT_INDEX } from "@/features/meta/domain/links";
import { mdBulletList, translatedLink, twinLink } from "./blocks";

// --- The twin document graph ---
// Every machine-readable document points a crawler at the rest of the graph. One module owns both
// shapes and every twin reaches its siblings through here, so a change to the graph lands in one
// place. Named apart from meta/domain/links.ts, which builds HTML <link> tags, so no file has to
// guess which "links" module an import resolves to.
//
// The static page paths are read from STATIC_PATHS — the one enumeration the HTML head, the sitemap,
// the twin routes and the twin cross-links all walk — so a page declared there is picked up here
// automatically. STATIC_PAGES.label is the visible-name field that declaration already owns, so this
// file has no label map of its own. The AI-index links are read off meta/domain/links.ts, which formats
// them beside the URL declaration the HTML heads and the Link headers already read.

// The home twin is the graph hub: every subpage twin points back at it and every detail twin is
// published from it, so the two writers of hub links read the one declared constant instead of
// spelling "/" themselves.
const HOME_LABEL = STATIC_PAGES[HOME_PATH].label;

// The home twin's link, read from the same declaration the sibling links walk so the hub and the
// spokes cannot disagree about which document is the hub.
const homeLink = (preferredLanguage: PreferredLanguage, translate: Translate) =>
  translatedLink(HOME_LABEL, twinLink(STATIC_PAGES[HOME_PATH].mdHref, preferredLanguage), translate);

// A static twin's "Pages" section: its siblings plus the two indexes.
//
// Sibling static twins, excluding the linking page, each pinned to the reader's own language. Every
// static twin is a leaf in the HTML navigation, so the sibling set is the complete graph of page
// twins. The linking page is excluded so a twin never advertises itself — a dead-end signal to AI
// crawlers.
export const twinIndexLinks = (copy: StaticPageCopy, translate: Translate) =>
  mdBulletList([
    ...Array.map(
      Array.filter(STATIC_PATHS, (path) => path !== copy.path),
      (path) => translatedLink(STATIC_PAGES[path].label, twinLink(STATIC_PAGES[path].mdHref, copy.preferredLanguage), translate)
    ),
    ...AI_INDEX_MARKDOWN_LINKS,
  ]);

// A detail twin's "Pages" section: the home twin plus the two indexes. A detail twin is also a dead
// end without this.
export const detailIndexLinks = (preferredLanguage: PreferredLanguage, translate: Translate) =>
  mdBulletList([homeLink(preferredLanguage, translate), ...AI_INDEX_MARKDOWN_LINKS]);

// The escape-hatch line of the shared Markdown 404: a dead end points its reader at the one document
// that lists every valid twin, language-pinned like every other twin link. It lives here because
// "where do you go from a dead end" is graph knowledge, not 404 wording.
//
// The index is named off links.ts rather than spelled inline, so the label and the URL stay the same
// two facts every other surface publishes.
export const deadEndEscapeLine = (preferredLanguage: PreferredLanguage, translate: Translate) =>
  `${escapeMdInline(translate(msg("See")))} ${homeLink(preferredLanguage, translate)} ${escapeMdInline(translate(msg("or")))} [${LLMS_TXT_INDEX.name}](${LLMS_TXT_INDEX.url}).`;
