/** Minimal structured JSON logger (one line per event, stdout). */
export interface Logger {
  info(msg: string, meta?: Record<string, unknown>): void;
  warn(msg: string, meta?: Record<string, unknown>): void;
  error(msg: string, meta?: Record<string, unknown>): void;
}

export function createLogger(service: string): Logger {
  const silent = process.env.LOG_SILENT === '1' || process.env.NODE_ENV === 'test';
  const emit = (level: string, msg: string, meta?: Record<string, unknown>) => {
    if (silent) return;
    process.stdout.write(JSON.stringify({ ts: new Date().toISOString(), level, service, msg, ...meta }) + '\n');
  };
  return {
    info: (m, meta) => emit('info', m, meta),
    warn: (m, meta) => emit('warn', m, meta),
    error: (m, meta) => emit('error', m, meta),
  };
}
