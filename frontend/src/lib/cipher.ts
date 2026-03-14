const TOKEN_SEPARATOR = " ";

export function tokenizeEncryptedPattern(pattern: string): string[] {
  if (pattern.trim().length === 0) {
    return [];
  }

  return pattern.split(TOKEN_SEPARATOR);
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
