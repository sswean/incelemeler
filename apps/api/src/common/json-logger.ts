import type { LoggerService, LogLevel } from '@nestjs/common';

const SECRET_KEY = /pass(word)?|secret|token|authorization|cookie|api[-_]?key|mfa|otp|iban|tckn/i;
const PATTERNS: [RegExp, string][] = [
  [/Bearer\s+[A-Za-z0-9._~+/=-]+/gi, 'Bearer [GİZLİ]'],
  [/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, '[E-POSTA]'],
  [/(?:\+?\b90[\s-]?0?|\b0?)5\d{2}[\s-]?\d{3}[\s-]?\d{2}[\s-]?\d{2}\b/g, '[TELEFON]'],
  [/\bTR\d{2}(?:\s?\d{4}){5}\s?\d{2}\b/gi, '[IBAN]'],
  [/\b[1-9]\d{10}\b/g, '[KİMLİK-NO]'],
  [/\b(?:\d{1,3}\.){3}\d{1,3}\b/g, '[IP]'],
];
const MAX_DEPTH = 6;

/** Serbest metindeki kişisel veri ve sır kalıplarını maskeler (§13.1). */
export function maskText(text: string): string {
  return PATTERNS.reduce((s, [re, repl]) => s.replace(re, repl), text);
}

/** Nesneyi log için güvenli hâle getirir: sır anahtarları silinir, metinler maskelenir. */
export function redact(value: unknown, depth = 0): unknown {
  if (typeof value === 'string') return maskText(value);
  if (typeof value === 'bigint') return value.toString();
  if (value instanceof Error) return { name: value.name, message: maskText(value.message) };
  if (value === null || typeof value !== 'object') return value;
  if (depth >= MAX_DEPTH) return '[DERİN]';
  if (Array.isArray(value)) return value.map((v) => redact(v, depth + 1));
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value)) {
    out[k] = SECRET_KEY.test(k) ? '[GİZLİ]' : redact(v, depth + 1);
  }
  return out;
}

/** JSON dizesi olarak verilen iletileri alanlara açar (mevcut `JSON.stringify({ event })` çağrıları). */
function fields(message: unknown): Record<string, unknown> {
  if (typeof message === 'string' && message.startsWith('{')) {
    try {
      const parsed: unknown = JSON.parse(message);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
    } catch {
      // Düz metin olarak kalır.
    }
  }
  if (message && typeof message === 'object' && !(message instanceof Error)) {
    return message as Record<string, unknown>;
  }
  return { msg: message };
}

/**
 * Yapılandırılmış JSON log (REQ-GUV-014): satır başına tek kayıt; kişisel veri ve sırlar maskelenir;
 * satır sonu ve denetim karakterleri JSON kaçışıyla etkisizleşir (log enjeksiyonu).
 */
export class JsonLogger implements LoggerService {
  private levels: Set<LogLevel>;

  constructor(
    levels: LogLevel[],
    private readonly write: (line: string) => void = (line) => process.stdout.write(line),
  ) {
    this.levels = new Set(levels);
  }

  setLogLevels(levels: LogLevel[]): void {
    this.levels = new Set(levels);
  }

  log(message: unknown, ...rest: unknown[]): void {
    this.emit('log', message, rest);
  }
  warn(message: unknown, ...rest: unknown[]): void {
    this.emit('warn', message, rest);
  }
  error(message: unknown, ...rest: unknown[]): void {
    this.emit('error', message, rest);
  }
  debug(message: unknown, ...rest: unknown[]): void {
    this.emit('debug', message, rest);
  }
  verbose(message: unknown, ...rest: unknown[]): void {
    this.emit('verbose', message, rest);
  }
  fatal(message: unknown, ...rest: unknown[]): void {
    this.emit('fatal', message, rest);
  }

  private emit(level: LogLevel, message: unknown, rest: unknown[]): void {
    if (!this.levels.has(level)) return;
    const context = typeof rest.at(-1) === 'string' ? (rest.at(-1) as string) : undefined;
    const extra = context === undefined ? rest : rest.slice(0, -1);
    const record = {
      ts: new Date().toISOString(),
      level,
      ...(context ? { context } : {}),
      ...(redact(fields(message)) as Record<string, unknown>),
      ...(extra.length ? { detail: redact(extra) } : {}),
    };
    this.write(JSON.stringify(record) + '\n');
  }
}
