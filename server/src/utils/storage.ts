import { config } from '../config';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs/promises';
import path from 'path';

const supabase = config.supabaseUrl && config.supabaseServiceRoleKey
  ? createClient(config.supabaseUrl, config.supabaseServiceRoleKey)
  : null;

export async function storeProof(file: Express.Multer.File, winnerId: string): Promise<string> {
  const extension = path.extname(file.originalname).toLowerCase() || '.png';
  const filename = `proof_${Date.now()}_${Math.random().toString(36).substring(7)}${extension}`;
  const storagePath = `${winnerId}/${filename}`;

  if (supabase) {
    const { error } = await supabase.storage
      .from('winner-proofs')
      .upload(storagePath, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (error) throw new Error(`Proof storage upload failed: ${error.message}`);
    return storagePath;
  }

  const proofDir = path.join(config.uploadDir, 'proofs');
  await fs.mkdir(proofDir, { recursive: true });
  await fs.writeFile(path.join(proofDir, filename), file.buffer);
  return `/uploads/proofs/${filename}`;
}

export async function createProofSignedUrl(storagePath: string): Promise<string | null> {
  if (!supabase || storagePath.startsWith('/') || /^https?:\/\//i.test(storagePath)) return storagePath;

  const { data, error } = await supabase.storage
    .from('winner-proofs')
    .createSignedUrl(storagePath, 300);

  if (error) throw new Error(`Proof URL generation failed: ${error.message}`);
  return data.signedUrl;
}

/**
 * Proof files are stored on disk by default.
 * When Supabase credentials are present, the URL prefix can point at a Storage bucket.
 */
export function publicProofUrl(filename: string): string {
  return filename.startsWith('/') ? filename : `/uploads/proofs/${filename}`;
}
