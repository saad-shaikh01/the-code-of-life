import { Injectable } from '@nestjs/common';
import {
  CIPHER_MAP,
  decodeCipherText,
  encodeCipherText,
  looksLikeCipherPattern,
  type SymbolMap,
} from '@code-of-life/shared';
import { DecodeResult } from './schemas/decoder.schema';

/**
 * DecoderService - Stateless utility for encoding/decoding numeric cipher
 * tokens from "The Code of Life" page 6 decoder bar.
 */
@Injectable()
export class DecoderService {
  private readonly defaultSymbolMap: SymbolMap = CIPHER_MAP;

  decode(encryptedPattern: string, customMap?: SymbolMap): DecodeResult {
    const symbolMap = { ...this.defaultSymbolMap, ...customMap };
    return decodeCipherText(encryptedPattern, symbolMap);
  }

  encode(text: string, customMap?: SymbolMap): DecodeResult {
    const symbolMap = { ...this.defaultSymbolMap, ...customMap };
    return encodeCipherText(text, symbolMap);
  }

  validateAttempt(
    attempt: string,
    originalReflection: string,
    caseSensitive = false,
  ): boolean {
    const normalizedAttempt = this.normalizeAttempt(attempt, caseSensitive);
    const normalizedReflection = this.normalizeText(
      originalReflection,
      caseSensitive,
    );

    return normalizedAttempt === normalizedReflection;
  }

  calculateSimilarity(attempt: string, originalReflection: string): number {
    const normalizedAttempt = this.normalizeAttempt(attempt, false);
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

  getDefaultSymbolMap(): SymbolMap {
    return { ...this.defaultSymbolMap };
  }

  private normalizeAttempt(text: string, caseSensitive: boolean): string {
    const preparedText = looksLikeCipherPattern(text)
      ? this.decode(text).output
      : text;

    return this.normalizeText(preparedText, caseSensitive);
  }

  private normalizeText(text: string, caseSensitive: boolean): string {
    let normalized = text.trim().replace(/\s+/g, ' ');
    if (!caseSensitive) {
      normalized = normalized.toLowerCase();
    }
    return normalized;
  }

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
          dp[i][j] =
            1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
        }
      }
    }

    return dp[m][n];
  }
}

export type { SymbolMap } from '@code-of-life/shared';
