import { ArgumentsHost, Catch, ExceptionFilter, HttpException, Logger } from '@nestjs/common';
import type { Request, Response } from 'express';
import { ProblemException, problemFor } from './problem.js';
import { traceIdOf } from './trace.js';
import { RateLimitedException } from '../modules/platform/rate-limit.service.js';

/** `http-errors` biçimli istemci hatası (expose=true, 4xx) ise durum kodu. */
function clientError(e: unknown): number | null {
  if (!e || typeof e !== 'object') return null;
  const { status, expose } = e as { status?: unknown; expose?: unknown };
  return expose === true && typeof status === 'number' && status >= 400 && status < 500
    ? status
    : null;
}

const SECURITY_EVENTS: Record<number, string> = {
  401: 'security.auth_failed',
  403: 'security.access_denied',
  429: 'security.rate_limited',
};

/** Tüm hataları problem+json'a çevirir; iç bilgi (yığın izi, SQL) istemciye sızmaz (REQ-GUV-015). */
@Catch()
export class ProblemFilter implements ExceptionFilter {
  private readonly logger = new Logger('ProblemFilter');

  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const req = http.getRequest<Request>();
    const res = http.getResponse<Response>();
    const traceId = traceIdOf(req);
    const instance = req.path;

    let body;
    if (exception instanceof RateLimitedException) {
      res.setHeader('Retry-After', String(exception.retryAfter));
    }
    if (exception instanceof ProblemException) {
      body = exception.toProblem(instance, traceId);
    } else if (exception instanceof HttpException) {
      body = problemFor(exception.getStatus(), instance, traceId);
    } else if (clientError(exception)) {
      // body-parser (http-errors): bozuk JSON 400, büyük gövde 413, desteklenmeyen kodlama 415.
      body = problemFor(clientError(exception)!, instance, traceId);
    } else {
      this.logger.error({ msg: 'unhandled_error', traceId, err: String(exception) });
      body = problemFor(500, instance, traceId);
    }
    const securityEvent = SECURITY_EVENTS[body.status];
    if (securityEvent) {
      // Güvenlik olayları ayrı olay türüyle loglanır (REQ-GUV-014); sorgu dizesi ve IP yazılmaz.
      this.logger.warn({ event: securityEvent, traceId, method: req.method, path: instance });
    }
    res.status(body.status).type('application/problem+json').json(body);
  }
}
