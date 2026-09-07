import { createLogger } from '@pvg/shared';
import { createApp } from './app.js';
import { config } from './config.js';

const log = createLogger('api');
createApp().listen(config.port, () => {
  log.info('listening', { port: config.port, busUrl: config.busUrl, corsOrigin: config.corsOrigin });
});
