import express, { type Express, type NextFunction, type Request, type Response } from 'express';
import { createLogger } from './logger.js';

export interface ServiceAppOptions {
  /** Service identifier used in logs and /health, e.g. "registro-civil". */
  name: string;
  /** If set, every non-/health request must carry `x-api-key: <apiKey>`. */
  apiKey?: string;
}

/**
 * Creates an Express app with JSON parsing, request logging, `/health` and (optionally) API-key
 * enforcement. Every service in the monorepo starts from this so behaviour is uniform.
 */
export function createServiceApp(opts: ServiceAppOptions): Express {
  const log = createLogger(opts.name);
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '256kb' }));

  app.use((req, res, next) => {
    const started = Date.now();
    res.on('finish', () => {
      if (req.path !== '/health') {
        log.info('request', { method: req.method, path: req.path, status: res.statusCode, ms: Date.now() - started });
      }
    });
    next();
  });

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: opts.name, mode: 'demo', timestamp: new Date().toISOString() });
  });

  if (opts.apiKey) {
    const expected = opts.apiKey;
    app.use((req, res, next) => {
      if (req.path === '/health') return next();
      const provided = req.header('x-api-key');
      if (provided !== expected) {
        return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'x-api-key inválida o ausente' } });
      }
      next();
    });
  }

  return app;
}

/** Standard JSON error handler; mount after all routes. */
export function errorHandler(name: string) {
  const log = createLogger(name);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  return (err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    const e = err as { status?: number; code?: string; message?: string };
    const status = e.status ?? 500;
    log.error('unhandled', { status, code: e.code, message: e.message });
    res.status(status).json({ error: { code: e.code ?? 'INTERNAL', message: e.message ?? 'Error interno' } });
  };
}

export class HttpError extends Error {
  constructor(public status: number, public code: string, message: string) {
    super(message);
  }
}

/** Reads a port from the environment with a default. */
export function envPort(name: string, fallback: number): number {
  const v = process.env[name];
  const n = v ? Number(v) : NaN;
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

/** Simulated processing delay so the workflow steps are visible on screen. */
export function simulatedLatency(): Promise<void> {
  const ms = Number(process.env.AGENCY_LATENCY_MS ?? 400);
  return new Promise((r) => setTimeout(r, Number.isFinite(ms) ? ms : 0));
}
