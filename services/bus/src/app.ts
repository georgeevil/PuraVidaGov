import { busRequestSchema, createLogger, createServiceApp, errorHandler, type BusRequest, type RegistryEntry } from '@pvg/shared';
import type { Express, NextFunction, Request, Response } from 'express';
import * as audit from './audit.js';
import { getRegistry } from './registry.js';
import { forward } from './router.js';

const SERVICE_NAME = 'bus';
const HEALTH_TIMEOUT_MS = 1500;
const HEALTH_CACHE_MS = 10_000;

const OPEN_PATHS = new Set(['/health', '/__demo/reset']);

export function createApp(): Express {
  const log = createLogger(SERVICE_NAME);
  const app = createServiceApp({ name: SERVICE_NAME });
  const busKey = process.env.BUS_API_KEY || 'demo-bus-key';

  app.use((req, res, next) => {
    if (OPEN_PATHS.has(req.path)) return next();
    if (req.header('x-api-key') !== busKey) {
      return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'x-api-key inválida o ausente' } });
    }
    next();
  });

  // ---- POST /bus/request
  app.post('/bus/request', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = busRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: { code: 'VALIDATION_ERROR', message: 'Solicitud inválida', details: parsed.error.flatten() },
        });
      }
      const result = await forward(parsed.data as BusRequest);
      res.status(result.ok ? 200 : result.error.status).json(result);
    } catch (err) {
      next(err);
    }
  });

  // ---- GET /bus/audit
  app.get('/bus/audit', (req, res) => {
    const subjectId = typeof req.query.subjectId === 'string' && req.query.subjectId ? req.query.subjectId : undefined;
    const rawLimit = Number(req.query.limit);
    const limit = Number.isFinite(rawLimit) && rawLimit > 0 ? rawLimit : 100;
    res.json(audit.query({ subjectId, limit }));
  });

  // ---- GET /bus/registry (health cached 10 s)
  let cache: { at: number; entries: RegistryEntry[] } | null = null;
  app.get('/bus/registry', async (_req, res, next) => {
    try {
      if (cache && Date.now() - cache.at < HEALTH_CACHE_MS) return res.json(cache.entries);
      const entries = await Promise.all(
        getRegistry().map(async (entry): Promise<RegistryEntry> => {
          const healthy = await pingHealth(entry.baseUrl);
          return { ...entry, healthy, lastChecked: new Date().toISOString() };
        }),
      );
      cache = { at: Date.now(), entries };
      res.json(entries);
    } catch (err) {
      next(err);
    }
  });

  // ---- POST /__demo/reset (no auth): reset audit and cascade to agencies
  app.post('/__demo/reset', async (_req, res) => {
    audit.reset();
    cache = null;
    const agencies: Record<string, boolean> = {};
    await Promise.all(
      getRegistry().map(async (entry) => {
        try {
          const r = await fetch(entry.baseUrl + '/__demo/reset', { method: 'POST', signal: AbortSignal.timeout(HEALTH_TIMEOUT_MS) });
          agencies[entry.service] = r.ok;
        } catch (err) {
          log.warn('agency reset failed', { service: entry.service, error: (err as Error)?.message });
          agencies[entry.service] = false;
        }
      }),
    );
    res.json({ ok: true, agencies });
  });

  app.use(errorHandler(SERVICE_NAME));
  return app;
}

async function pingHealth(baseUrl: string): Promise<boolean> {
  try {
    const r = await fetch(baseUrl + '/health', { signal: AbortSignal.timeout(HEALTH_TIMEOUT_MS) });
    if (!r.ok) return false;
    const body = (await r.json().catch(() => null)) as { status?: string } | null;
    return body?.status === 'ok';
  } catch {
    return false;
  }
}
