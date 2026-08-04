import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Optional stub only — do not implement yet
// TODO: getCalibratedWeights()
// Calibration: w1=0.3 (tag), w2=multiplier (1.0 match / 0.3 mismatch for constraint), w3=0.4 (editorial cosine)
// This is a stub for Phase 6.
export function getCalibratedWeights() {
  return {
    w1: 0.3,
    w2_match: 1.0,
    w2_mismatch: 0.3,
    w3: 0.4,
  };
}

// Helper to retry Prisma operations if Neon drops the connection
async function withRetry<T>(operation: () => Promise<T>, maxRetries = 3): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error: any) {
      if (i === maxRetries - 1) throw error;
      if (error.code === 'P1017' || error.code === 'P1001') {
        console.warn(`Connection lost (P1017). Retrying in 1s... (Attempt ${i + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, 1000));
      } else {
        throw error;
      }
    }
  }
  throw new Error("Unreachable");
}

async function computeTagIDF() {
  console.log('Computing Tag IDF...');
  const problems = await prisma.problem.findMany({ select: { id: true, tags: true } });
  
  const tagCounts: Record<string, number> = {};
  let totalProblems = problems.length;
  
  for (const p of problems) {
    for (const tag of p.tags) {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    }
  }

  const tagIdfs: Record<string, number> = {};
  for (const tag in tagCounts) {
    tagIdfs[tag] = Math.log(totalProblems / tagCounts[tag]);
  }

  for (const p of problems) {
    const weights: Record<string, number> = {};
    for (const tag of p.tags) {
      weights[tag] = tagIdfs[tag];
    }
    await withRetry(() => prisma.problem.update({
      where: { id: p.id },
      data: { idf_tag_weights: weights },
    }));
  }
  console.log('Tag IDF completed.');
}

function extractFingerprint(statement: string | null): string {
  if (!statement) return 'unknown';
  
  // Look for numeric bounds in statement text
  const regex = /(?:[nNmMNkK]\s*(?:\\le|<=|<|\\leq)\s*|1\s*(?:\\le|<=|<|\\leq)\s*[nNmMNkK]\s*(?:\\le|<=|<|\\leq)\s*)(10\^?[0-9]+|[0-9,]+)/g;
  let maxBound = 0;
  let match;
  while ((match = regex.exec(statement)) !== null) {
    let numStr = match[1].replace(/,/g, '');
    let val = 0;
    if (numStr.includes('10^') || numStr.includes('10**')) {
      const exp = parseInt(numStr.split('^')[1] || numStr.split('**')[1]);
      val = Math.pow(10, exp);
    } else {
      val = parseInt(numStr, 10);
    }
    if (!isNaN(val) && val > maxBound) maxBound = val;
  }

  if (maxBound === 0) return 'unknown';
  if (maxBound <= 30) return 'exponential';
  if (maxBound <= 5000) return 'quadratic_cubic';
  if (maxBound <= 1000000) return 'nlogn_linear';
  if (maxBound <= 1000000000000) return 'logn_binary_math'; // 10^12
  return 'bignum_numbertheory';
}

async function computeConstraintFingerprint() {
  console.log('Computing Constraint Fingerprints...');
  const problems = await prisma.problem.findMany({ select: { id: true, statement_text: true } });
  
  for (const p of problems) {
    const fp = extractFingerprint(p.statement_text);
    await withRetry(() => prisma.problem.update({
      where: { id: p.id },
      data: { constraint_fingerprint: fp }
    }));
  }
  console.log('Constraint fingerprint completed.');
}

function getWords(text: string) {
  return text.toLowerCase().match(/\b\w+\b/g) || [];
}

function getTF(words: string[]): Record<string, number> {
  const tf: Record<string, number> = {};
  for (const w of words) tf[w] = (tf[w] || 0) + 1;
  return tf;
}

function cosineSimilarity(tf1: Record<string, number>, tf2: Record<string, number>): number {
  let dot = 0;
  let norm1 = 0;
  let norm2 = 0;
  const allKeys = new Set([...Object.keys(tf1), ...Object.keys(tf2)]);
  for (const k of allKeys) {
    const v1 = tf1[k] || 0;
    const v2 = tf2[k] || 0;
    dot += v1 * v2;
    norm1 += v1 * v1;
    norm2 += v2 * v2;
  }
  if (norm1 === 0 || norm2 === 0) return 0;
  return dot / (Math.sqrt(norm1) * Math.sqrt(norm2));
}

async function segmentEditorials() {
  console.log('Segmenting Editorials...');
  // Clear old segments
  await prisma.editorialSegment.deleteMany({});
  
  const problems = await prisma.problem.findMany({ select: { id: true, editorial_text: true } });
  const markerRegex = /(?:solution\s*[0-9]+|approach\s*[0-9]+|alternatively solution|alternative solution|another way)/i;

  for (const p of problems) {
    if (!p.editorial_text) continue;
    const text = p.editorial_text;

    let segments: { text: string, source: string }[] = [];
    
    // a. Try regex header markers
    if (markerRegex.test(text)) {
      const parts = text.split(new RegExp(`(?=${markerRegex.source})`, 'i')).filter(s => s.trim().length > 0);
      if (parts.length > 1) {
        segments = parts.map(part => ({ text: part.trim(), source: 'explicit_marker' }));
      }
    }

    // b. TextTiling style segmentation
    if (segments.length === 0) {
      const words = getWords(text);
      if (words.length > 80) {
        const windowSize = 40;
        const step = 20;
        const boundaries: number[] = [0];
        
        for (let i = 0; i < words.length - 2 * windowSize; i += step) {
          const w1 = words.slice(i, i + windowSize);
          const w2 = words.slice(i + windowSize, i + 2 * windowSize);
          const sim = cosineSimilarity(getTF(w1), getTF(w2));
          if (sim < 0.3) {
            boundaries.push(i + windowSize);
          }
        }
        
        if (boundaries.length > 1) {
          boundaries.push(words.length);
          for (let i = 0; i < boundaries.length - 1; i++) {
            const startIdx = boundaries[i];
            const endIdx = boundaries[i+1];
            const segWords = words.slice(startIdx, endIdx);
            segments.push({ text: segWords.join(' '), source: 'textiling_split' });
          }
        }
      }
    }

    // c. Fallback
    if (segments.length === 0) {
      segments.push({ text: text, source: 'single_fallback' });
    }

    for (const seg of segments) {
      await withRetry(() => prisma.editorialSegment.create({
        data: {
          problemId: p.id,
          segment_text: seg.text,
          source: seg.source,
        }
      }));
    }
  }
  console.log('Editorial Segmentation completed.');
}

async function computeTFIDF() {
  console.log('Computing TF-IDF...');
  const segments = await prisma.editorialSegment.findMany({ select: { id: true, problemId: true, segment_text: true } });
  
  // also need statement texts for fallback
  const problems = await prisma.problem.findMany({ select: { id: true, statement_text: true, editorial_text: true } });
  const noEditorialProblems = problems.filter(p => !p.editorial_text && p.statement_text);
  
  const documents: { id: string, text: string, isSegment: boolean }[] = [];
  segments.forEach(s => documents.push({ id: s.id, text: s.segment_text, isSegment: true }));
  noEditorialProblems.forEach(p => documents.push({ id: p.id, text: p.statement_text!, isSegment: false }));

  const numDocs = documents.length;
  if (numDocs === 0) return;

  const df: Record<string, number> = {};
  const docTFs: Record<string, Record<string, number>> = {};

  for (const doc of documents) {
    const words = getWords(doc.text);
    const tf = getTF(words);
    docTFs[doc.id] = tf;
    for (const w in tf) {
      df[w] = (df[w] || 0) + 1;
    }
  }

  const idfs: Record<string, number> = {};
  for (const w in df) {
    idfs[w] = Math.log(numDocs / df[w]);
  }

  for (const doc of documents) {
    const tfidf: Record<string, number> = {};
    const tf = docTFs[doc.id];
    let norm = 0;
    
    for (const w in tf) {
      const val = tf[w] * idfs[w];
      tfidf[w] = val;
      norm += val * val;
    }
    
    norm = Math.sqrt(norm);
    if (norm > 0) {
      for (const w in tfidf) {
        tfidf[w] /= norm;
      }
    }

    if (doc.isSegment) {
      await withRetry(() => prisma.editorialSegment.update({
        where: { id: doc.id },
        data: { tfidf_vector: tfidf }
      }));
    } else {
      await withRetry(() => prisma.editorialSegment.create({
        data: {
          problemId: doc.id,
          segment_text: doc.text,
          source: 'single_fallback',
          tfidf_vector: tfidf
        }
      }));
    }
  }
  
  console.log('TF-IDF vectorization completed.');
}

async function main() {
  try {
    await computeTagIDF();
    await computeConstraintFingerprint();
    await segmentEditorials();
    await computeTFIDF();
    console.log('Offline indexing pipeline completed successfully.');
  } catch (error) {
    console.error('Error running pipeline:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}
