import { Injectable } from '@nestjs/common';
import { DecodeResult } from './schemas/decoder.schema';

/**
 * Symbol mapping type for the decoder
 */
export interface SymbolMap {
  [symbol: string]: string;
}

/**
 * DecoderService - Stateless utility for encoding/decoding symbols
 *
 * This service handles the core logic of mapping symbols, numbers,
 * and punctuation to text based on "The Code of Life" book's system.
 */
@Injectable()
export class DecoderService {
  /**
   * Default symbol map based on the book's encoding system.
   * This can be extended or overridden per puzzle.
   */
  private readonly defaultSymbolMap: SymbolMap = {
    // Placeholder mappings - to be populated with actual book symbols
    '☀': 'A',
    '☽': 'B',
    '★': 'C',
    '♦': 'D',
    '♥': 'E',
    '♣': 'F',
    '♠': 'G',
    '◆': 'H',
    '○': 'I',
    '●': 'J',
    '□': 'K',
    '■': 'L',
    '△': 'M',
    '▽': 'N',
    '◇': 'O',
    '⬡': 'P',
    '⬢': 'Q',
    '✦': 'R',
    '✧': 'S',
    '⚡': 'T',
    '☯': 'U',
    '✿': 'V',
    '❀': 'W',
    '✵': 'X',
    '❂': 'Y',
    '✡': 'Z',
    // Numbers
    '①': '1',
    '②': '2',
    '③': '3',
    '④': '4',
    '⑤': '5',
    '⑥': '6',
    '⑦': '7',
    '⑧': '8',
    '⑨': '9',
    '⓪': '0',
    // Punctuation preserved
    ' ': ' ',
    '.': '.',
    ',': ',',
    '!': '!',
    '?': '?',
    "'": "'",
    '-': '-',
  };

  /**
   * Decode an encrypted pattern to readable text
   * @param encryptedPattern - The symbol-encoded message
   * @param customMap - Optional custom symbol map to override defaults
   * @returns DecodeResult with decoded text and statistics
   */
  decode(encryptedPattern: string, customMap?: SymbolMap): DecodeResult {
    const symbolMap = { ...this.defaultSymbolMap, ...customMap };
    const symbols = [...encryptedPattern];
    const unmappedSymbols: string[] = [];
    let mappedCount = 0;

    const output = symbols
      .map((symbol) => {
        if (symbolMap[symbol] !== undefined) {
          mappedCount++;
          return symbolMap[symbol];
        }
        if (!unmappedSymbols.includes(symbol)) {
          unmappedSymbols.push(symbol);
        }
        return symbol;
      })
      .join('');

    return {
      output,
      unmappedSymbols,
      mappedCount,
      totalSymbols: symbols.length,
    };
  }

  /**
   * Encode readable text to symbols
   * @param text - Plain text to encode
   * @param customMap - Optional custom symbol map to override defaults
   * @returns DecodeResult with encoded pattern and statistics
   */
  encode(text: string, customMap?: SymbolMap): DecodeResult {
    const symbolMap = { ...this.defaultSymbolMap, ...customMap };
    const reverseMap = this.createReverseMap(symbolMap);
    const characters = [...text.toUpperCase()];
    const unmappedSymbols: string[] = [];
    let mappedCount = 0;

    const output = characters
      .map((char) => {
        if (reverseMap[char] !== undefined) {
          mappedCount++;
          return reverseMap[char];
        }
        if (!unmappedSymbols.includes(char)) {
          unmappedSymbols.push(char);
        }
        return char;
      })
      .join('');

    return {
      output,
      unmappedSymbols,
      mappedCount,
      totalSymbols: characters.length,
    };
  }

  /**
   * Validate if a user's attempt matches the original reflection
   * @param attempt - User's decoded attempt
   * @param originalReflection - The correct decoded message
   * @param caseSensitive - Whether to check case sensitivity
   * @returns boolean indicating if the attempt is correct
   */
  validateAttempt(
    attempt: string,
    originalReflection: string,
    caseSensitive = false,
  ): boolean {
    const normalizedAttempt = this.normalizeText(attempt, caseSensitive);
    const normalizedReflection = this.normalizeText(
      originalReflection,
      caseSensitive,
    );
    return normalizedAttempt === normalizedReflection;
  }

  /**
   * Calculate similarity score between attempt and correct answer
   * @param attempt - User's decoded attempt
   * @param originalReflection - The correct decoded message
   * @returns Similarity score from 0 to 1
   */
  calculateSimilarity(attempt: string, originalReflection: string): number {
    const normalizedAttempt = this.normalizeText(attempt, false);
    const normalizedReflection = this.normalizeText(originalReflection, false);

    if (normalizedAttempt === normalizedReflection) return 1;
    if (normalizedAttempt.length === 0 || normalizedReflection.length === 0) {
      return 0;
    }

    const distance = this.levenshteinDistance(
      normalizedAttempt,
      normalizedReflection,
    );
    const maxLength = Math.max(
      normalizedAttempt.length,
      normalizedReflection.length,
    );

    return 1 - distance / maxLength;
  }

  /**
   * Get the default symbol map
   * @returns Copy of the default symbol map
   */
  getDefaultSymbolMap(): SymbolMap {
    return { ...this.defaultSymbolMap };
  }

  /**
   * Create a reverse mapping (text -> symbol)
   */
  private createReverseMap(symbolMap: SymbolMap): SymbolMap {
    const reverseMap: SymbolMap = {};
    for (const [symbol, text] of Object.entries(symbolMap)) {
      reverseMap[text] = symbol;
    }
    return reverseMap;
  }

  /**
   * Normalize text for comparison
   */
  private normalizeText(text: string, caseSensitive: boolean): string {
    let normalized = text.trim().replace(/\s+/g, ' ');
    if (!caseSensitive) {
      normalized = normalized.toLowerCase();
    }
    return normalized;
  }

  /**
   * Calculate Levenshtein distance between two strings
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const m = str1.length;
    const n = str2.length;
    const dp: number[][] = Array(m + 1)
      .fill(null)
      .map(() => Array(n + 1).fill(0));

    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;

    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (str1[i - 1] === str2[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1];
        } else {
          dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
        }
      }
    }

    return dp[m][n];
  }
}
