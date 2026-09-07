import { createLogger, envPort } from '@pvg/shared';
import { createApp } from './app.js';

const port = envPort('BUS_PORT', 4000);
const log = createLogger('bus');
createApp().listen(port, () => log.info('listening', { port }));
