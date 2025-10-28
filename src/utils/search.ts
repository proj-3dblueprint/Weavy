/**
 * Enhanced search utility with improved relevance scoring
 * - Prioritizes word boundary matches over substring matches
 * - Supports fuzzy matching for single character typos
 * - Prioritizes matches at the beginning of words
 * - Prioritizes matches in the first word of multi-word terms
 */

interface SearchResult<T> {
  item: T;
  score: number;
  matchedField: string;
}

/**
 * Calculates Levenshtein distance between two strings
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix = Array(str2.length + 1)
    .fill(null)
    .map(() => Array(str1.length + 1).fill(null));

  for (let i = 0; i <= str1.length; i++) {
    matrix[0][i] = i;
  }

  for (let j = 0; j <= str2.length; j++) {
    matrix[j][0] = j;
  }

  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1, // deletion
        matrix[j - 1][i] + 1, // insertion
        matrix[j - 1][i - 1] + indicator, // substitution
      );
    }
  }

  return matrix[str2.length][str1.length];
}

/**
 * Checks if search term matches a word boundary in the text
 */
function matchesWordBoundary(text: string, searchTerm: string): boolean {
  const words = text.toLowerCase().split(/\s+/);
  return words.some((word) => word.startsWith(searchTerm.toLowerCase()));
}

/**
 * Checks if search term fuzzy matches a word (allows 1 character difference)
 */
function fuzzyMatchesWord(text: string, searchTerm: string): boolean {
  const words = text.toLowerCase().split(/\s+/);
  return words.some((word) => {
    if (word.startsWith(searchTerm.toLowerCase())) return true;
    if (Math.abs(word.length - searchTerm.length) <= 1) {
      return levenshteinDistance(word, searchTerm.toLowerCase()) <= 1;
    }
    return false;
  });
}

/**
 * Calculates relevance score for a search match
 * Higher scores = more relevant results
 */
function calculateRelevanceScore(text: string, searchTerm: string, isFirstWord: boolean = false): number {
  const lowerText = text.toLowerCase();
  const lowerSearch = searchTerm.toLowerCase();

  // Perfect word boundary match at start of first word (highest priority)
  if (isFirstWord && lowerText.startsWith(lowerSearch)) {
    return 1000;
  }

  // Word boundary match in first word
  if (isFirstWord && matchesWordBoundary(text, searchTerm)) {
    return 800;
  }

  // Word boundary match in any word
  if (matchesWordBoundary(text, searchTerm)) {
    return 600;
  }

  // Fuzzy match in first word
  if (isFirstWord && fuzzyMatchesWord(text, searchTerm)) {
    return 400;
  }

  // Fuzzy match in any word
  if (fuzzyMatchesWord(text, searchTerm)) {
    return 200;
  }

  // Substring match (lowest priority)
  if (lowerText.includes(lowerSearch)) {
    return 100;
  }

  return 0;
}

/**
 * Enhanced search function that returns items with relevance scoring
 */
export function searchWithRelevance<T>(
  items: T[],
  searchTerm: string,
  getSearchableText: (item: T) => string[],
): SearchResult<T>[] {
  if (!searchTerm.trim()) {
    return items.map((item) => ({ item, score: 0, matchedField: '' }));
  }

  const results: SearchResult<T>[] = [];

  for (const item of items) {
    const searchableTexts = getSearchableText(item);
    let bestScore = 0;
    let bestMatchedField = '';

    for (const text of searchableTexts) {
      if (!text) continue;

      // Check if the search term matches the first word specifically
      const words = text.split(/\s+/);
      const firstWord = words[0]?.toLowerCase() || '';
      const searchTermLower = searchTerm.toLowerCase();
      const isFirstWord =
        firstWord.startsWith(searchTermLower) ||
        (Math.abs(firstWord.length - searchTerm.length) <= 1 && levenshteinDistance(firstWord, searchTermLower) <= 1);

      const score = calculateRelevanceScore(text, searchTerm, isFirstWord);

      if (score > bestScore) {
        bestScore = score;
        bestMatchedField = text;
      }
    }

    if (bestScore > 0) {
      results.push({
        item,
        score: bestScore,
        matchedField: bestMatchedField,
      });
    }
  }

  // Sort by score (highest first)
  return results.sort((a, b) => b.score - a.score);
}

/**
 * Enhanced search function that returns filtered items sorted by relevance
 */
export function searchAndSort<T>(items: T[], searchTerm: string, getSearchableText: (item: T) => string[]): T[] {
  const results = searchWithRelevance(items, searchTerm, getSearchableText);
  return results.map((result) => result.item);
}
