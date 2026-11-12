// constants
export const MAX_CHUNK_LENGTH = 80;
export const TYPING_SPEED = 80;
export const DELETING_SPEED = 80;
export const TYPO_PROBABILITY = 0.03;

// The three typo kinds share the roll's remaining range equally: below the first share the typo
// swaps the character with its neighbor, below the second it is skipped, and the rest inserts a
// random letter after it
export const TYPO_SWAP_SHARE = 0.33;
export const TYPO_SKIP_SHARE = 0.66;

// The alphabet insertion typos draw from
export const LOWERCASE_LETTERS = "abcdefghijklmnopqrstuvwxyz";
