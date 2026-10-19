import type { CardCommercial } from '@incelemeler/contracts';

/**
 * Ticari ilişki etiketi (Ek A8.2, REQ-SPN-003): metin olarak, başlıktan önce, kapatılamaz; ekran okuyucu
 * bağlantı adında önce etiketi okur ("Sponsorlu {ad}"). `NONE` dışındaki her kartta zorunlu olarak basılır.
 */
export function CommercialLabel({ commercial }: { commercial: CardCommercial }) {
  if (commercial.type === 'NONE') return null;
  return (
    <span
      className="mr-2 inline-block rounded-sm bg-sponsored-bg px-1.5 align-middle text-sm font-semibold text-sponsored-text no-underline"
      data-testid="sponsored-label"
    >
      {commercial.label}
    </span>
  );
}
