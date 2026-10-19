import { isIP } from 'node:net';

/**
 * Dış yönlendirme hedefinin güvenlik kuralları (REQ-AFF-002/006): hedef yalnızca veritabanındaki şablondan
 * üretilir; şablonda yalnızca izinli yer tutucular; kişisel veri içermez; alan adı izin listesinde olmalı.
 */
export const TEMPLATE_VARS = ['subId', 'surface'] as const;
export type TemplateVars = Partial<Record<(typeof TEMPLATE_VARS)[number], string>>;

/** `{subId}` gibi yer tutucuları URL kodlayarak doldurur; tanımsız yer tutucu boş kalır. */
export function expandTemplate(template: string, vars: TemplateVars): string {
  return template.replace(/\{([a-zA-Z]+)\}/g, (_m, name: string) => {
    if (!(TEMPLATE_VARS as readonly string[]).includes(name)) {
      throw new Error(`İzinsiz şablon değişkeni: ${name}`);
    }
    return encodeURIComponent(vars[name as keyof TemplateVars] ?? '');
  });
}

/** Alan adını karşılaştırma biçimine getirir (küçük harf, punycode — URL ayrıştırıcısı yapar). */
export function normalizeDomain(d: string): string | null {
  try {
    return new URL(`https://${d.trim()}`).hostname.toLowerCase();
  } catch {
    return null;
  }
}

export type TargetCheck = { ok: true; url: string; host: string } | { ok: false; reason: string };

/**
 * Hedef URL denetimi: yalnızca https, kimlik bilgisi yok, IP adresi yok, varsayılan dışı port yok,
 * ana makine izinli alan adlarından biri ya da alt alan adı (Unicode alan adları punycode'a çevrilerek).
 */
export function checkTarget(
  raw: string,
  allowedDomains: string[],
  opts: { allowHttp?: boolean } = {},
): TargetCheck {
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    return { ok: false, reason: 'invalid_url' };
  }
  // İşletmenin kendi web sitesi http olabilir (iletişim bilgisi); ticari bağlantılar yalnızca https.
  if (u.protocol !== 'https:' && !(opts.allowHttp && u.protocol === 'http:')) {
    return { ok: false, reason: 'scheme' };
  }
  if (u.username || u.password) return { ok: false, reason: 'credentials' };
  if (u.port && u.port !== '443' && u.port !== '80') return { ok: false, reason: 'port' };
  const host = u.hostname.toLowerCase();
  if (isIP(host.replace(/^\[|\]$/g, '')) !== 0) return { ok: false, reason: 'ip_literal' };
  const allowed = allowedDomains.map(normalizeDomain).filter((d): d is string => !!d);
  if (!allowed.some((d) => host === d || host.endsWith(`.${d}`))) {
    return { ok: false, reason: 'domain_not_allowed' };
  }
  return { ok: true, url: u.toString(), host };
}

const BOT =
  /bot|crawl|spider|slurp|preview|facebookexternalhit|embedly|headless|lighthouse|curl|wget|python-requests|httpclient/i;

/** Bot ve önceden getirme tıklamaları raporlara girmez (REQ-AFF-005). */
export function classifyClick(headers: {
  userAgent: string | null;
  secPurpose: string | null;
  purpose: string | null;
}) {
  const prefetch = /prefetch|prerender/i.test(
    `${headers.secPurpose ?? ''} ${headers.purpose ?? ''}`,
  );
  const bot = !headers.userAgent || BOT.test(headers.userAgent);
  return { prefetch, bot };
}
