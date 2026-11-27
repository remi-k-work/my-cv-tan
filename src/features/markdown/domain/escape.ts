// services, features, and other libraries
import { Array, pipe, String } from "effect";

// constants
const INLINE_RULES: ReadonlyArray<readonly [RegExp, string]> = [
  [/!(?=\[)/g, "\\!"],
  [/([`*[\]<&])/g, "\\$1"],
];

// Block constructs binding within 0-3 leading spaces
const BLOCK_RULES: ReadonlyArray<readonly [RegExp, string]> = [
  [/^( {0,3})([#>])/gm, "$1\\$2"],
  [/^( {0,3})([-+])(?=\s|$)/gm, "$1\\$2"],
  [/^( {0,3})(\d+)([.)])(?=\s|$)/gm, "$1$2\\$3"],
  [/^( {0,3})([-_])(?=(?:\s*\2){2,}\s*$)/gm, "$1\\$2"],
  [/^( {0,3})([-=])(?=\2*\s*$)/gm, "$1\\$2"],
  [/^(?! {4})([ \t|:]*)(-)(?=[ \t|:-]*$)/gm, "$1\\$2"],
];

// Escape multi-character runs first, then paired single tildes; lone tildes remain prose
const EMPHASIS_RULES: ReadonlyArray<readonly [RegExp, string]> = [
  [/(?<![\p{L}\p{N}])_|_(?![\p{L}\p{N}])/gu, "\\$&"],
  [/~(?=~)|(?<=~)~/gu, "\\~"],
  [/(?<!\\)~([^~\n]+)(?<!\\)~/g, "\\~$1\\~"],
];

// Backslashes are literal in indented code, so text escaping runs only outside code blocks
const TEXT_RULES: ReadonlyArray<readonly [RegExp, string]> = [[/\\/g, "\\\\"], ...INLINE_RULES, ...EMPHASIS_RULES, ...BLOCK_RULES];
const BLANK_LINE_RULE: readonly [RegExp, string] = [/\n{3,}/g, "\n\n"];
const CODE_INDENT = /^(?: {4}|\t)/;

const escapeTextLine = (line: string) =>
  Array.reduce(TEXT_RULES, line, (escaped, [pattern, replacement]) => pipe(escaped, String.replace(pattern, replacement)));

const escapeBlocks = (text: string) => {
  const [, lines] = Array.mapAccum(String.split(text, "\n"), { inCode: false, afterBlank: true }, ({ inCode, afterBlank }, line) => {
    if (String.isEmpty(String.trim(line))) return [{ inCode, afterBlank: true }, line];

    // An indented line continues code only after a blank line or another code line; otherwise it is a lazy continuation
    const isCode = CODE_INDENT.test(line) && (inCode || afterBlank);
    return [{ inCode: isCode, afterBlank: false }, isCode ? line : escapeTextLine(line)];
  });
  return Array.join(lines, "\n");
};

// Escapes block-level markdown text
export const escapeMd = (text: string) =>
  pipe(text, String.replace(/\r\n?/g, "\n"), String.trimStart, escapeBlocks, String.replace(BLANK_LINE_RULE[0], BLANK_LINE_RULE[1]), String.trim);

// Escapes inline markdown text, collapsing newlines into spaces
export const escapeMdInline = (text: string) => escapeMd(pipe(text, String.replace(/[\r\n]+/g, " ")));
