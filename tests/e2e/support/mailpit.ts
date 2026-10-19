import { expect } from '@playwright/test';
import { MAILPIT_URL } from '../env.js';

type Summary = { ID: string; Subject: string };

/** Yerel e-posta yakalayıcıdan (Mailpit) alıcıya giden son iletinin (isteğe bağlı konu süzgeciyle) metnini bekler. */
export async function waitForMail(to: string, subject?: string): Promise<string> {
  let id: string | undefined;
  await expect
    .poll(
      async () => {
        const res = await fetch(
          `${MAILPIT_URL}/api/v1/search?query=${encodeURIComponent(`to:"${to}"`)}`,
        );
        const body = (await res.json()) as { messages: Summary[] };
        id = body.messages.find((m) => !subject || m.Subject.includes(subject))?.ID;
        return id;
      },
      { timeout: 15_000 },
    )
    .toBeTruthy();
  const res = await fetch(`${MAILPIT_URL}/api/v1/message/${id}`);
  const msg = (await res.json()) as { Text: string };
  return msg.Text;
}
