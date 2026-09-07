import { createServiceApp, errorHandler, simulatedLatency, cedulaSchema } from '@pvg/shared';
import type { Express } from 'express';
import { requireApiKey, wrap } from './middleware.js';
import { store } from './store.js';

export const SERVICE_NAME = 'registro-civil';

export function createApp(): Express {
  const apiKey = process.env.REGISTRO_API_KEY ?? 'demo-registro-key';
  const app = createServiceApp({ name: SERVICE_NAME });
  app.use(requireApiKey(apiKey));

  app.post('/__demo/reset', (_req, res) => {
    store.reset();
    res.json({ ok: true, service: SERVICE_NAME });
  });

  app.get('/registro/citizens', (_req, res) => {
    res.json(store.list());
  });

  app.get(
    '/registro/citizen/:id',
    wrap(async (req, res) => {
      const id = String(req.params.id);
      if (!cedulaSchema.safeParse(id).success) {
        return res
          .status(400)
          .json({ error: { code: 'VALIDATION_ERROR', message: 'La cédula debe tener el formato 0-0000-0000' } });
      }
      await simulatedLatency();
      const citizen = store.get(id);
      if (!citizen) {
        return res
          .status(404)
          .json({ error: { code: 'CITIZEN_NOT_FOUND', message: `No existe una persona con la cédula ${id}` } });
      }
      res.json(citizen);
    }),
  );

  app.use((_req, res) => {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Recurso no encontrado' } });
  });
  app.use(errorHandler(SERVICE_NAME));
  return app;
}
