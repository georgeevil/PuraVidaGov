import { createLogger, envPort } from '@pvg/shared';
import { createApp, SERVICE_NAME } from './app.js';

const port = envPort('REGISTRO_PORT', 4001);
const log = createLogger(SERVICE_NAME);
createApp().listen(port, () => {
  log.info('listening', { port, mode: 'demo' });
});
