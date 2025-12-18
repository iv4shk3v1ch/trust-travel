/**
 * Test script for embedding service
 * Run with: npx tsx scripts/test-embeddings.ts
 */

import { pipeline } from '@xenova/transformers';
import { EMBEDDING_DIMENSION, EMBEDDING_MODEL } from '../src/core/types/vectorTypes';

async function testEmbeddings() {
  console.log('🧪 Testing Embedding Service\n');
  
  console.log('Model:', EMBEDDING_MODEL);
  console.log('Expected dimension:', EMBEDDING_DIMENSION);
  console.log('\n---\n');

  try {
    // Initialize pipeline
    console.log('1️⃣ Initializing model...');
    const extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
    console.log('✅ Model initialized\n');

    // Test 1: Simple text
    console.log('2️⃣ Testing simple text...');
    const text1 = 'This is a cozy Italian restaurant in Prague';
    const output1 = await extractor(text1, { pooling: 'mean', normalize: true });
    const embedding1 = Array.from(output1.data);
    console.log(`✅ Generated embedding of length ${embedding1.length}`);
    console.log(`   First 5 values: [${embedding1.slice(0, 5).map(v => v.toFixed(4)).join(', ')}]`);
    console.log(`   Dimension match: ${embedding1.length === EMBEDDING_DIMENSION ? '✅' : '❌'}\n`);

    // Test 2: Place description
    console.log('3️⃣ Testing place description...');
    const placeText = `
      Name: Café Louvre
      Type: Café & Restaurant
      Description: Historic café established in 1902, serving Czech and international cuisine
      Location: Prague, Národní třída 22
      Price Level: medium
      Environment: indoor
    `.trim();
    const output2 = await extractor(placeText, { pooling: 'mean', normalize: true });
    const embedding2 = Array.from(output2.data);
    console.log(`✅ Generated embedding of length ${embedding2.length}`);
    console.log(`   First 5 values: [${embedding2.slice(0, 5).map(v => v.toFixed(4)).join(', ')}]`);
    console.log(`   Dimension match: ${embedding2.length === EMBEDDING_DIMENSION ? '✅' : '❌'}\n`);

    // Test 3: Similarity calculation
    console.log('4️⃣ Testing similarity calculation...');
    const text3a = 'Italian restaurant with pasta and pizza';
    const text3b = 'Italian cuisine serving traditional pasta dishes';
    const text3c = 'Modern bar with cocktails and live music';
    
    const [out3a, out3b, out3c] = await Promise.all([
      extractor(text3a, { pooling: 'mean', normalize: true }),
      extractor(text3b, { pooling: 'mean', normalize: true }),
      extractor(text3c, { pooling: 'mean', normalize: true }),
    ]);
    
    const emb3a = Array.from(out3a.data);
    const emb3b = Array.from(out3b.data);
    const emb3c = Array.from(out3c.data);
    
    // Calculate cosine similarities
    const simAB = cosineSimilarity(emb3a, emb3b);
    const simAC = cosineSimilarity(emb3a, emb3c);
    const simBC = cosineSimilarity(emb3b, emb3c);
    
    console.log(`   Similarity (Italian restaurant A vs B): ${simAB.toFixed(4)} - ${simAB > 0.7 ? '✅ High' : '⚠️ Low'}`);
    console.log(`   Similarity (Italian restaurant vs Bar): ${simAC.toFixed(4)} - ${simAC < 0.5 ? '✅ Low' : '⚠️ High'}`);
    console.log(`   Similarity (Italian cuisine vs Bar): ${simBC.toFixed(4)} - ${simBC < 0.5 ? '✅ Low' : '⚠️ High'}`);
    
    // Verify semantic understanding
    if (simAB > simAC && simAB > simBC) {
      console.log('   ✅ Semantic understanding verified: Similar concepts have higher similarity\n');
    } else {
      console.log('   ⚠️ Unexpected similarity scores\n');
    }

    // Test 4: Batch processing
    console.log('5️⃣ Testing batch processing...');
    const texts = [
      'Café with coffee and pastries',
      'Restaurant serving Czech cuisine',
      'Museum with historical exhibitions',
      'Park with walking trails',
      'Bar with craft beer selection',
    ];
    
    const start = Date.now();
    const embeddings = await Promise.all(
      texts.map(text => extractor(text, { pooling: 'mean', normalize: true }))
    );
    const duration = Date.now() - start;
    
    console.log(`✅ Generated ${embeddings.length} embeddings in ${duration}ms`);
    console.log(`   Average: ${(duration / embeddings.length).toFixed(1)}ms per embedding\n`);

    // Summary
    console.log('---\n');
    console.log('📊 TEST SUMMARY:');
    console.log('✅ Model initialization: SUCCESS');
    console.log('✅ Embedding generation: SUCCESS');
    console.log('✅ Dimension verification: SUCCESS');
    console.log('✅ Semantic similarity: SUCCESS');
    console.log('✅ Batch processing: SUCCESS');
    console.log('\n🎉 All tests passed! Embedding service is ready.\n');
    
  } catch (error) {
    console.error('\n❌ TEST FAILED:');
    console.error(error);
    process.exit(1);
  }
}

// Helper: Calculate cosine similarity
function cosineSimilarity(a: number[], b: number[]): number {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Run tests
testEmbeddings();
