import type { NextFunction, Request, Response } from 'express';

/**
 * API güvenlik başlıkları (REQ-GUV-005): JSON yanıtlar tarayıcıda belge olarak yorumlanmaz, çerçevelenmez.
 * Uç noktaya özgü başlıklar (önbellek, X-Robots-Tag) denetleyicilerde eklenir.
 */
export function securityHeaders(_req: Request, res: Response, next: NextFunction): void {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'");
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Cross-Origin-Resource-Policy', 'same-site');
  next();
}
