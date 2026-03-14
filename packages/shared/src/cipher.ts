export type SymbolMap = Record<string, string>;

export interface CipherTransformResult {
  output: string;
  unmappedSymbols: string[];
  mappedCount: number;
  totalSymbols: number;
}

export const CIPHER_TOKEN_SEPARATOR = ' ';
export const CIPHER_WORD_BREAK = '';
export const CIPHER_ELLIPSIS = '...';
export const CIPHER_ELLIPSIS_TOKEN = '37';

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

const baseCipherMap: SymbolMap = {
  '0': '*',
  '27': ',',
  '28': '?',
  '29': ';',
  '30': ':',
  '31': "'",
  '32': '"',
  '33': '.',
  '34': '!',
  '35': '&',
  '36': '-',
  '37': CIPHER_ELLIPSIS,
};

for (const [index, letter] of LETTERS.entries()) {
  baseCipherMap[String(index + 1)] = letter;
}

export const CIPHER_MAP: SymbolMap = Object.freeze(baseCipherMap);

export function tokenizeCipherPattern(pattern: string): string[] {
  const trimmedPattern = pattern.trim();
  if (trimmedPattern.length === 0) {
    return [];
  }

  return trimmedPattern.split(CIPHER_TOKEN_SEPARATOR);
}

export function isCipherWordBreak(token: string): boolean {
  return token === CIPHER_WORD_BREAK;
}

export function getCipherTokenCount(pattern: string): number {
  return tokenizeCipherPattern(pattern).filter(
    (token) => !isCipherWordBreak(token),
  ).length;
}

export function looksLikeCipherPattern(input: string): boolean {
  const trimmedInput = input.trim();
  return trimmedInput.length > 0 && /^[0-9 ]+$/.test(trimmedInput);
}

export function createReverseCipherMap(symbolMap: SymbolMap = CIPHER_MAP): SymbolMap {
  const reverseMap: SymbolMap = {};

  for (const [token, value] of Object.entries(symbolMap)) {
    reverseMap[value] = token;
  }

  return reverseMap;
}

export function decodeCipherText(
  encryptedPattern: string,
  symbolMap: SymbolMap = CIPHER_MAP,
): CipherTransformResult {
  const tokens = tokenizeCipherPattern(encryptedPattern);
  const unmappedSymbols: string[] = [];
  let mappedCount = 0;

  const output = tokens
    .map((token) => {
      if (isCipherWordBreak(token)) {
        mappedCount++;
        return ' ';
      }

      if (symbolMap[token] !== undefined) {
        mappedCount++;
        return symbolMap[token];
      }

      if (!unmappedSymbols.includes(token)) {
        unmappedSymbols.push(token);
      }

      return token;
    })
    .join('');

  return {
    output,
    unmappedSymbols,
    mappedCount,
    totalSymbols: tokens.length,
  };
}

export function encodeCipherText(
  text: string,
  symbolMap: SymbolMap = CIPHER_MAP,
): CipherTransformResult {
  const reverseMap = createReverseCipherMap(symbolMap);
  const characters = tokenizePlainText(text);
  const unmappedSymbols: string[] = [];
  let mappedCount = 0;

  const output = characters
    .map((character) => {
      if (isCipherWordBreak(character)) {
        mappedCount++;
        return CIPHER_WORD_BREAK;
      }

      if (reverseMap[character] !== undefined) {
        mappedCount++;
        return reverseMap[character];
      }

      if (!unmappedSymbols.includes(character)) {
        unmappedSymbols.push(character);
      }

      return character;
    })
    .join(CIPHER_TOKEN_SEPARATOR);

  return {
    output,
    unmappedSymbols,
    mappedCount,
    totalSymbols: characters.length,
  };
}

function tokenizePlainText(text: string): string[] {
  const normalizedText = text.toUpperCase();
  const characters: string[] = [];

  for (let index = 0; index < normalizedText.length; index++) {
    const currentCharacter = normalizedText[index];

    if (normalizedText.slice(index, index + 3) === CIPHER_ELLIPSIS) {
      characters.push(CIPHER_ELLIPSIS);
      index += 2;
      continue;
    }

    if (currentCharacter === '…') {
      characters.push(CIPHER_ELLIPSIS);
      continue;
    }

    if (/\s/.test(currentCharacter)) {
      characters.push(CIPHER_WORD_BREAK);
      continue;
    }

    characters.push(currentCharacter);
  }

  return characters;
}
