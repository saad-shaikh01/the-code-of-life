export type SymbolMap = Record<string, string>;

export const CIPHER_TOKEN_SEPARATOR = " ";
export const CIPHER_ELLIPSIS = "...";

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

const baseCipherMap: SymbolMap = {
  "0": "*",
  "27": ",",
  "28": "?",
  "29": ";",
  "30": ":",
  "31": "'",
  '32': '"',
  "33": ".",
  "34": "!",
  "35": "&",
  "36": "-",
  "37": CIPHER_ELLIPSIS,
};

for (const [index, letter] of LETTERS.entries()) {
  baseCipherMap[String(index + 1)] = letter;
}

export const CIPHER_MAP: SymbolMap = Object.freeze(baseCipherMap);

export function tokenizeEncryptedPattern(pattern: string): string[] {
  if (pattern.trim().length === 0) {
    return [];
  }

  return pattern.split(CIPHER_TOKEN_SEPARATOR);
}

export function getOrderedCipherEntries(symbolMap: SymbolMap = CIPHER_MAP) {
  return Object.entries(symbolMap).sort(
    ([leftToken], [rightToken]) => Number(leftToken) - Number(rightToken),
  );
}

export function getCipherPreviewTokens(pattern: string, maxTokens: number) {
  const tokens = tokenizeEncryptedPattern(pattern);
  const previewTokens: string[] = [];
  const totalVisibleTokens = tokens.filter(Boolean).length;
  let visibleTokens = 0;

  for (const token of tokens) {
    if (token === "") {
      if (
        previewTokens.length > 0 &&
        previewTokens[previewTokens.length - 1] !== ""
      ) {
        previewTokens.push(token);
      }
      continue;
    }

    if (visibleTokens >= maxTokens) {
      break;
    }

    previewTokens.push(token);
    visibleTokens++;
  }

  while (previewTokens[previewTokens.length - 1] === "") {
    previewTokens.pop();
  }

  return {
    tokens: previewTokens,
    hasMore: totalVisibleTokens > visibleTokens,
  };
}
