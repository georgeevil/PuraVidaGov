import { createLogger, envPort } from '@pvg/shared';
import { createApp, SERVICE_NAME } from './app.js';

const port = envPort('MUNICIPALIDAD_PORT', 4004);
const log = createLogger(SERVICE_NAME);
createApp().listen(port, () => {
  log.info('listening', { port, mode: 'demo' });
});
