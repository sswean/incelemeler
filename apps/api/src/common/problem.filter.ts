import { ArgumentsHost, Catch, ExceptionFilter, HttpException, Logger } from '@nestjs/common';
import type { Request, Response } from 'express';
import { ProblemException, problemFor } from './problem.js';
import { traceIdOf } from './trace.js';
import { RateLimitedException } from '../modules/platform/rate-limit.service.js';

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
    } else {
      this.logger.error({ msg: 'unhandled_error', traceId, err: String(exception) });
      body = problemFor(500, instance, traceId);
    }
    res.status(body.status).type('application/problem+json').json(body);
  }
}
