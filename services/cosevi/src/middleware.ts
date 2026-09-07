import type { NextFunction, Request, RequestHandler, Response } from 'express';
import type { ZodSchema } from 'zod';

/** Paths that never require the API key: health checks and the demo reset. */
const OPEN_PATHS = new Set(['/health', '/__demo/reset']);

/**
 * API-key middleware with the demo exemptions. `createServiceApp` cannot exempt `/__demo/reset`,
 * so the app is created without `apiKey` and this middleware is mounted instead.
 */
export function requireApiKey(expected: string): RequestHandler {
  return (req, res, next) => {
    if (OPEN_PATHS.has(req.path)) return next();
    if (req.header('x-api-key') !== expected) {
      return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'x-api-key inválida o ausente' } });
    }
    next();
  };
}

/** Validates `req.body` against a zod schema; replaces it with the parsed value on success. */
export function validateBody<T>(schema: ZodSchema<T>): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      const detail = parsed.error.issues
        .map((i) => `${i.path.join('.') || 'body'}: ${i.message}`)
        .join('; ');
      return res
        .status(400)
        .json({ error: { code: 'VALIDATION_ERROR', message: `Solicitud inválida — ${detail}` } });
    }
    req.body = parsed.data;
    next();
  };
}

/** Wraps an async handler so rejections reach the error handler (Express 4). */
export function wrap(fn: (req: Request, res: Response) => Promise<unknown>): RequestHandler {
  return (req, res, next) => {
    fn(req, res).catch(next);
  };
}
