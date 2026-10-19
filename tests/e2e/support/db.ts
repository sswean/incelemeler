import pg from 'pg';
import { E2E_DATABASE_URL } from '../env.js';

/**
 * Yalnızca izole E2E veritabanında zaman geçişi benzetimi: personelin son ikinci faktör doğrulamasını geriye alır
 * (step-up süresinin dolması — REQ-GUV-017). Ürün verisi üretmez.
 */
export async function ageStepUp(email: string, minutes: number): Promise<void> {
  const db = new pg.Client({ connectionString: E2E_DATABASE_URL });
  await db.connect();
  try {
    await db.query(
      `UPDATE sessions SET step_up_at = now() - make_interval(mins => $2)
        WHERE revoked_at IS NULL AND user_id = (SELECT id FROM users WHERE email = $1)`,
      [email, minutes],
    );
  } finally {
    await db.end();
  }
}
