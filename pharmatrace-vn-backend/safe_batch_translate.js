import pool from './src/config/db.js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import fs from 'fs';
import { execSync } from 'child_process';

dotenv.config();

const apiKey = process.env.API_GEMINI || 'AQ.Ab8RN6K8HpfEYe1roaKZAaybxzfrX5BYuJgy2jcHnX8JQyTXSg';
const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function parseJsonSafely(text) {
  try {
    const cleaned = text.replace(/```json\s*|\s*```/gi, '').trim();
    return JSON.parse(cleaned);
  } catch {
    const match = text.match(/\[[\s\S]*\]/);
    if (match) {
      return JSON.parse(match[0]);
    }
    const singleMatch = text.match(/\{[\s\S]*\}/);
    if (singleMatch) {
      return [JSON.parse(singleMatch[0])];
    }
    throw new Error('Failed to parse JSON response');
  }
}

async function translateBatch(items) {
  const prompt = `You are a certified pharmaceutical medical translator. Translate the following list of ${items.length} Vietnamese medications into professional US/international medical English (like FDA prescribing labels).

Requirements:
- "ten_thuoc": Professional English title with active ingredient/brand, strength, dosage form, and packaging (e.g. "Panthenol 5% Topical Cream for Skin Lesions and Burns (Tube of 20g)").
- "mo_ta_ngan": Concise professional medical summary in English.
- "chi_tiet_thuoc": Translated JSON object where medical strings are translated into English. Keep all JSON keys intact.

Return ONLY a valid JSON array of objects:
[
  {
    "id": <same integer id>,
    "ten_thuoc": "...",
    "mo_ta_ngan": "...",
    "chi_tiet_thuoc": { ... }
  }
]

Input items:
${JSON.stringify(items.map(d => ({
  id: d.id,
  ten_thuoc: d.ten_thuoc,
  mo_ta_ngan: d.mo_ta_ngan,
  chi_tiet_thuoc: d.chi_tiet_thuoc
})), null, 2)}
`;

  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      const res = await model.generateContent(prompt);
      const data = parseJsonSafely(res.response.text());
      if (Array.isArray(data) && data.length > 0) {
        return data;
      }
    } catch (err) {
      const isRate = err.message?.includes('429') || err.message?.includes('quota') || err.message?.includes('ResourceExhausted');
      const waitTime = isRate ? 15000 : 4000;
      console.warn(`    ⚠️ Batch attempt ${attempt} warning: ${err.message}. Waiting ${waitTime/1000}s...`);
      await sleep(waitTime);
    }
  }
  return null;
}

async function run() {
  console.log('🚀 Starting Safe Batch English Translation Pipeline (15 items/batch)...');
  
  const res = await pool.query(`
    SELECT id, ten_thuoc, mo_ta_ngan, chi_tiet_thuoc 
    FROM duocpham 
    WHERE ten_thuoc ~* '[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]'
       OR chi_tiet_thuoc::text ~* '[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]'
    ORDER BY id ASC
  `);

  const drugs = res.rows;
  const total = drugs.length;
  console.log(`Total medications to translate: ${total}`);

  const BATCH_SIZE = 15;
  const chunks = [];
  for (let i = 0; i < total; i += BATCH_SIZE) {
    chunks.push(drugs.slice(i, i + BATCH_SIZE));
  }

  console.log(`Total Batches: ${chunks.length} (Only ${chunks.length} API calls total, perfectly safe!).\n`);

  let translatedCount = 0;

  for (let b = 0; b < chunks.length; b++) {
    const chunk = chunks[b];
    const ids = chunk.map(d => d.id).join(', ');
    console.log(`[Batch ${b + 1}/${chunks.length}] Translating ${chunk.length} items (IDs: ${ids})...`);

    const result = await translateBatch(chunk);

    if (result && Array.isArray(result)) {
      for (const item of result) {
        if (!item.id || !item.ten_thuoc) continue;
        try {
          await pool.query(`
            UPDATE duocpham 
            SET ten_thuoc = $1,
                mo_ta_ngan = $2,
                chi_tiet_thuoc = $3::jsonb
            WHERE id = $4
          `, [
            item.ten_thuoc,
            item.mo_ta_ngan || item.ten_thuoc,
            JSON.stringify(item.chi_tiet_thuoc || {}),
            item.id
          ]);
          translatedCount++;
        } catch (dbErr) {
          console.error(`  ✗ DB update error on ID ${item.id}:`, dbErr.message);
        }
      }
      console.log(`  ✓ Batch ${b + 1} completed! Total progress: ${translatedCount}/${total}`);
    } else {
      console.error(`  ✗ Batch ${b + 1} failed after retries. Moving to next batch.`);
    }

    // Safe delay 2.5s between requests to stay well below 15 RPM
    await sleep(2500);
  }

  console.log(`\n🎉 TRANSLATION COMPLETE! Total medicines translated: ${translatedCount}/${total}`);
  
  // Backup database automatically!
  console.log('💾 Generating permanent backup with pg_dump...');
  try {
    const dumpCmd = `& "C:\\Program Files\\PostgreSQL\\18\\bin\\pg_dump.exe" -U postgres -h 127.0.0.1 -p 5432 -d pharmatrace-vn-db --clean --if-exists --no-owner --no-privileges -f "D:\\Personal\\Project\\pharma-trace-vn-fullstack\\database\\init.sql"`;
    execSync(`powershell -Command "$env:PGPASSWORD='HuyLe@574406'; ${dumpCmd}"`, { stdio: 'inherit' });
    console.log('✅ Successfully saved permanent backup to database/init.sql!');
  } catch (dumpErr) {
    console.warn('Backup dump note:', dumpErr.message);
  }

  await pool.end();
  process.exit(0);
}

run().catch(console.error);
