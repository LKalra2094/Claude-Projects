// scripts/download-model.js
// Run once from Application/ directory: node scripts/download-model.js

const { pipeline } = require('@xenova/transformers');

async function downloadModel() {
  console.log('Downloading model (this may take a few minutes)...');
  await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', {
    cache_dir: './models/Semantic_Search_Model',
  });
  console.log('Model downloaded to ./models/Semantic_Search_Model');
}

downloadModel();
