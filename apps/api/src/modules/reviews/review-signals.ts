import { normalizeTr } from '@incelemeler/utils';

/**
 * Otomatik moderasyon sinyalleri (Ek A6.6): sinyal üretir, tek başına ceza vermez. Risk skoru eşiği aşan ya da
 * zorunlu ön moderasyon gerektiren değerlendirme yayından önce insan onayına gider.
 */
export interface SignalContext {
  title: string | null;
  body: string;
  accountAgeDays: number;
  /** Hesabın yayımlanmış (onaylanmış) değerlendirme sayısı. */
  approvedReviewCount: number;
  /** Aynı hesabın son 24 saatteki gönderimleri (bu dahil değil). */
  recentByUser24h: number;
  /** Aynı IP önekinden son 24 saatteki gönderimler. */
  recentByIp24h: number;
  /** Aynı listelemeye son 24 saatteki gönderimler. */
  listingReviews24h: number;
  /** Diğer değerlendirmelerle en yüksek metin benzerliği (0–1, trigram). */
  maxSimilarity: number;
  userEmailDomain: string;
  listingWebsiteDomain: string | null;
  ymyl: boolean;
}

export interface ModerationConfig {
  riskThreshold: number;
  /** Bu sayıdan az onaylanmış değerlendirmesi olan hesaplar ön moderasyona gider (varsayılan 3). */
  trustedAfter: number;
}

export const DEFAULT_MODERATION: ModerationConfig = { riskThreshold: 40, trustedAfter: 3 };

export interface Signal {
  code: string;
  weight: number;
  detail: string | null;
}

export interface Assessment {
  riskScore: number;
  signals: Signal[];
  preModeration: boolean;
}

/** T.C. kimlik numarası denetim basamakları (yanlış pozitifleri azaltır). */
export function isValidTckn(s: string): boolean {
  if (!/^[1-9]\d{10}$/.test(s)) return false;
  const d = [...s].map(Number);
  const odd = d[0]! + d[2]! + d[4]! + d[6]! + d[8]!;
  const even = d[1]! + d[3]! + d[5]! + d[7]!;
  const d10 = (((odd * 7 - even) % 10) + 10) % 10;
  const d11 = d.slice(0, 10).reduce((a, b) => a + b, 0) % 10;
  return d10 === d[9] && d11 === d[10];
}

const PERSONAL_DATA: Array<[string, RegExp]> = [
  // Rakam dizisinin parçası olmayan TR telefon numarası (sipariş/fiş numaralarını yakalamaz).
  ['phone', /(?<![\d+])(?:\+?90[\s-]?)?\(?0?[2-5]\d{2}\)?[\s-]?\d{3}[\s-]?\d{2}[\s-]?\d{2}(?!\d)/],
  ['email', /[\w.+-]+@[\w-]+\.[\w.-]+/],
  ['iban', /\bTR\s?\d{2}(?:\s?\d{4}){5}\s?\d{2}\b/i],
  ['plate', /\b(?:0[1-9]|[1-7]\d|8[01])\s?[A-ZÇĞİÖŞÜ]{1,3}\s?\d{2,4}\b/],
];
const LINK = /\bhttps?:\/\/|\bwww\.|\b[\w-]+\.(?:com|net|org|com\.tr|net\.tr|org\.tr)\b/i;
/** Küfür/hakaret sözlüğü (katlanmış biçim, tam kelime; panelden genişletme D13). */
const PROFANITY = new Set([
  'salak',
  'gerizekali',
  'serefsiz',
  'orospu',
  'pic',
  'siktir',
  'amk',
  'yavsak',
  'pezevenk',
  'kahpe',
  'aptal',
  'ahmak',
]);
/** Sağlık/tedavi iddiası (yayından önce insan incelemesi). */
const HEALTH = [
  'tedavi etti',
  'iyilestirdi',
  'sifa verdi',
  'kanseri',
  'ilac yerine',
  'doktora gerek yok',
  'hastaligimi gecirdi',
];

export function assessReview(
  ctx: SignalContext,
  cfg: ModerationConfig = DEFAULT_MODERATION,
): Assessment {
  const text = `${ctx.title ?? ''} ${ctx.body}`;
  const folded = normalizeTr(text).folded;
  const words = new Set(folded.split(' '));
  const signals: Signal[] = [];
  let force = false;

  const pd = PERSONAL_DATA.filter(([, re]) => re.test(text)).map(([k]) => k);
  const tckn = (text.match(/\b\d{11}\b/g) ?? []).some(isValidTckn);
  if (tckn) pd.push('tckn');
  if (pd.length) {
    signals.push({ code: 'PERSONAL_DATA', weight: 40, detail: pd.join(',') });
    force = true;
  }
  const bad = [...PROFANITY].filter((w) => words.has(w));
  if (bad.length) signals.push({ code: 'PROFANITY', weight: 30, detail: String(bad.length) });
  if (LINK.test(text)) signals.push({ code: 'LINK', weight: 25, detail: null });
  if (HEALTH.some((p) => folded.includes(p))) {
    signals.push({ code: 'HEALTH_CLAIM', weight: 0, detail: null });
    force = true;
  }
  if (ctx.maxSimilarity >= 0.8) {
    signals.push({ code: 'DUPLICATE_TEXT', weight: 40, detail: ctx.maxSimilarity.toFixed(2) });
  }
  if (ctx.recentByUser24h >= 3) {
    signals.push({ code: 'VELOCITY_ACCOUNT', weight: 30, detail: String(ctx.recentByUser24h) });
  }
  if (ctx.recentByIp24h >= 5) {
    signals.push({ code: 'VELOCITY_NETWORK', weight: 30, detail: String(ctx.recentByIp24h) });
  }
  if (ctx.accountAgeDays < 7) signals.push({ code: 'NEW_ACCOUNT', weight: 10, detail: null });
  if (ctx.listingReviews24h >= 10) {
    signals.push({ code: 'LISTING_WAVE', weight: 20, detail: String(ctx.listingReviews24h) });
  }
  if (
    ctx.listingWebsiteDomain &&
    ctx.userEmailDomain &&
    (ctx.userEmailDomain === ctx.listingWebsiteDomain ||
      ctx.userEmailDomain.endsWith(`.${ctx.listingWebsiteDomain}`))
  ) {
    signals.push({ code: 'BUSINESS_RELATED', weight: 50, detail: ctx.userEmailDomain });
  }
  if (ctx.ymyl) {
    signals.push({ code: 'YMYL_CATEGORY', weight: 0, detail: null });
    force = true;
  }
  if (ctx.approvedReviewCount < cfg.trustedAfter) {
    signals.push({ code: 'FEW_APPROVED', weight: 0, detail: String(ctx.approvedReviewCount) });
    force = true;
  }
  const riskScore = Math.min(
    100,
    signals.reduce((s, x) => s + x.weight, 0),
  );
  return { riskScore, signals, preModeration: force || riskScore >= cfg.riskThreshold };
}
