import { CohereClient } from 'cohere-ai';

const cohere = new CohereClient({
  token: process.env.COHERE_API_KEY,
});

/**
 * Calculate cosine similarity between two vectors.
 * Returns a value between 0 and 1 (clamped for numerical stability).
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length === 0 || b.length === 0) {
    return 0;
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  if (denominator === 0) return 0;

  return Math.max(0, Math.min(1, dotProduct / denominator));
}

/**
 * Calculate semantic similarity between a query and multiple descriptions.
 * Uses Cohere Embed v3 with separate input types for queries and documents.
 */
export async function calculateSemanticSimilarities(
  query: string,
  descriptions: string[]
): Promise<number[]> {
  if (!process.env.COHERE_API_KEY) {
    throw new Error(
      'COHERE_API_KEY environment variable is not set. ' +
      'Add it to .env.local for development or to Vercel environment variables for production.'
    );
  }

  console.log(`[embeddings] Encoding query and ${descriptions.length} descriptions via Cohere...`);
  console.time('[embeddings] cohere-embed');

  // Encode query with search_query input type
  const queryResponse = await cohere.v2.embed({
    texts: [query],
    model: 'embed-english-v3.0',
    inputType: 'search_query',
    embeddingTypes: ['float'],
  });

  const queryEmbedding = queryResponse.embeddings.float![0];

  // Filter out empty descriptions and track their indices
  const nonEmptyIndices: number[] = [];
  const nonEmptyTexts: string[] = [];
  descriptions.forEach((desc, i) => {
    if (desc && desc.trim().length > 0) {
      nonEmptyIndices.push(i);
      nonEmptyTexts.push(desc);
    }
  });

  // If all descriptions are empty, return zeros
  if (nonEmptyTexts.length === 0) {
    console.timeEnd('[embeddings] cohere-embed');
    return descriptions.map(() => 0);
  }

  // Encode descriptions with search_document input type
  const docResponse = await cohere.v2.embed({
    texts: nonEmptyTexts,
    model: 'embed-english-v3.0',
    inputType: 'search_document',
    embeddingTypes: ['float'],
  });

  const docEmbeddings = docResponse.embeddings.float!;

  console.timeEnd('[embeddings] cohere-embed');

  // Map back to original indices, filling empty descriptions with 0
  const similarities = new Array(descriptions.length).fill(0);
  nonEmptyIndices.forEach((originalIndex, embeddingIndex) => {
    similarities[originalIndex] = cosineSimilarity(queryEmbedding, docEmbeddings[embeddingIndex]);
  });

  return similarities;
}
