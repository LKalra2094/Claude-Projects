import { pipeline, FeatureExtractionPipeline } from '@xenova/transformers';
import { join } from 'path';

// Module-level variable to cache the model
let embeddingPipeline: FeatureExtractionPipeline | null = null;

const MODEL_NAME = 'Xenova/all-MiniLM-L6-v2';
const MODEL_CACHE_DIR = join(process.cwd(), 'models', 'Semantic_Search_Model');

/**
 * Get or initialize the embedding pipeline.
 * Model loads once and stays in memory for subsequent requests.
 */
async function getEmbeddingPipeline(): Promise<FeatureExtractionPipeline> {
  if (embeddingPipeline) {
    console.log('[embeddings] Using cached model');
    return embeddingPipeline;
  }

  console.log(`[embeddings] MODEL_CACHE_DIR: ${MODEL_CACHE_DIR}`);
  console.log('[embeddings] Loading embedding model...');
  console.time('[embeddings] model-load');
  embeddingPipeline = await pipeline('feature-extraction', MODEL_NAME, {
    cache_dir: MODEL_CACHE_DIR,
    local_files_only: true,
  });
  console.timeEnd('[embeddings] model-load');
  console.log('[embeddings] Model loaded successfully');

  return embeddingPipeline;
}

/**
 * Encode a single text string into a vector embedding.
 * Returns a normalized vector (unit length for cosine similarity).
 */
export async function encodeText(text: string): Promise<number[]> {
  const pipe = await getEmbeddingPipeline();
  const output = await pipe(text, { pooling: 'mean', normalize: true });
  return Array.from(output.data as Float32Array);
}

/**
 * Encode multiple text strings into vector embeddings.
 * More efficient than encoding one at a time.
 */
export async function encodeTexts(texts: string[]): Promise<number[][]> {
  const pipe = await getEmbeddingPipeline();
  const embeddings: number[][] = [];

  console.log(`[embeddings] Encoding ${texts.length} descriptions...`);
  console.time('[embeddings] encode-descriptions');

  for (let i = 0; i < texts.length; i++) {
    const text = texts[i];
    if (!text || text.trim().length === 0) {
      // Empty text gets zero vector
      embeddings.push([]);
    } else {
      const output = await pipe(text, { pooling: 'mean', normalize: true });
      embeddings.push(Array.from(output.data as Float32Array));
    }
    if (i === 0) {
      console.log('[embeddings] First description encoded successfully');
    }
  }

  console.timeEnd('[embeddings] encode-descriptions');
  return embeddings;
}

/**
 * Calculate cosine similarity between two vectors.
 * Both vectors should already be normalized (unit length).
 * Returns a value between 0 and 1 (clamped for numerical stability).
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  // Handle empty vectors
  if (a.length === 0 || b.length === 0) {
    return 0;
  }

  // Dot product of normalized vectors = cosine similarity
  let dotProduct = 0;
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
  }

  // Clamp to [0, 1] range (negative similarity treated as 0 for our use case)
  return Math.max(0, Math.min(1, dotProduct));
}

/**
 * Calculate semantic similarity between a query and a description.
 * Returns a value between 0 and 1.
 */
export async function calculateSemanticSimilarity(
  query: string,
  description: string
): Promise<number> {
  if (!description || description.trim().length === 0) {
    return 0;
  }

  const [queryEmbedding, descEmbedding] = await Promise.all([
    encodeText(query),
    encodeText(description),
  ]);

  return cosineSimilarity(queryEmbedding, descEmbedding);
}

/**
 * Calculate semantic similarity between a query and multiple descriptions.
 * More efficient than calling calculateSemanticSimilarity multiple times.
 */
export async function calculateSemanticSimilarities(
  query: string,
  descriptions: string[]
): Promise<number[]> {
  const queryEmbedding = await encodeText(query);
  const descEmbeddings = await encodeTexts(descriptions);

  return descEmbeddings.map((descEmbedding) =>
    cosineSimilarity(queryEmbedding, descEmbedding)
  );
}
