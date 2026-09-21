import { config } from '../config';

/**
 * Proof files are stored on disk by default.
 * When Supabase credentials are present, the URL prefix can point at a Storage bucket.
 */
export function publicProofUrl(filename: string): string {
  if (config.supabaseUrl) {
    return `${config.supabaseUrl}/storage/v1/object/public/winner-proofs/${filename}`;
  }
  return `/uploads/proofs/${filename}`;
}
