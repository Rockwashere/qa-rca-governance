import { normalizeString } from './utils';

interface CodeForComparison {
  id: string;
  mainRca: string;
  rca1: string | null;
  rca2: string | null;
  rca3: string | null;
  rca4: string | null;
  rca5: string | null;
  definition: string;
  tags: string[];
}

interface SimilarityResult {
  code: CodeForComparison;
  score: number;
  reason: string;
}

function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

function stringSimilarity(a: string, b: string): number {
  if (!a || !b) return 0;
  const normA = normalizeString(a);
  const normB = normalizeString(b);
  if (normA === normB) return 1;
  
  const maxLen = Math.max(normA.length, normB.length);
  if (maxLen === 0) return 1;
  
  const distance = levenshteinDistance(normA, normB);
  return 1 - distance / maxLen;
}

function tagOverlap(tagsA: string[], tagsB: string[]): number {
  if (tagsA.length === 0 || tagsB.length === 0) return 0;
  
  const setA = new Set(tagsA.map((t) => t.toLowerCase()));
  const setB = new Set(tagsB.map((t) => t.toLowerCase()));
  
  let intersection = 0;
  for (const tag of setA) {
    if (setB.has(tag)) intersection++;
  }
  
  const union = new Set([...setA, ...setB]).size;
  return intersection / union; // Jaccard similarity
}

export function findSimilarCodes(
  input: {
    mainRca: string;
    rca1?: string | null;
    rca2?: string | null;
    rca3?: string | null;
    rca4?: string | null;
    rca5?: string | null;
    definition?: string;
    tags?: string[];
  },
  existingCodes: CodeForComparison[],
  threshold: number = 0.4
): SimilarityResult[] {
  const results: SimilarityResult[] = [];

  for (const code of existingCodes) {
    let totalScore = 0;
    let reasons: string[] = [];

    // Main RCA match (exact)
    if (code.mainRca === input.mainRca) {
      totalScore += 0.2;
      reasons.push('Same main category');
    }

    // RCA hierarchy similarity
    const hierarchyPairs = [
      { input: input.rca1, existing: code.rca1, label: 'RCA1' },
      { input: input.rca2, existing: code.rca2, label: 'RCA2' },
      { input: input.rca3, existing: code.rca3, label: 'RCA3' },
      { input: input.rca4, existing: code.rca4, label: 'RCA4' },
      { input: input.rca5, existing: code.rca5, label: 'RCA5' },
    ];

    for (const pair of hierarchyPairs) {
      if (pair.input && pair.existing) {
        const sim = stringSimilarity(pair.input, pair.existing);
        if (sim > 0.7) {
          totalScore += 0.15;
          reasons.push(`Similar ${pair.label}: "${pair.existing}"`);
        }
      }
    }

    // Definition similarity
    if (input.definition && code.definition) {
      const defSim = stringSimilarity(input.definition, code.definition);
      if (defSim > 0.5) {
        totalScore += defSim * 0.2;
        reasons.push('Similar definition');
      }
    }

    // Tag overlap
    if (input.tags && input.tags.length > 0) {
      const tagSim = tagOverlap(input.tags, code.tags);
      if (tagSim > 0.3) {
        totalScore += tagSim * 0.15;
        reasons.push(`Overlapping tags`);
      }
    }

    if (totalScore >= threshold) {
      results.push({
        code,
        score: Math.min(totalScore, 1),
        reason: reasons.join('; '),
      });
    }
  }

  return results.sort((a, b) => b.score - a.score).slice(0, 5);
}
