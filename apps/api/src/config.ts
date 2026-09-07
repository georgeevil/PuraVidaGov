/** Environment configuration for the citizen-portal API. Every value has a demo-safe default. */
function num(name: string, fallback: number): number {
  const v = process.env[name];
  const n = v === undefined || v === '' ? NaN : Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function str(name: string, fallback: string): string {
  const v = process.env[name];
  return v === undefined || v === '' ? fallback : v;
}

export const config = {
  port: num('API_PORT', 3001),
  busUrl: str('BUS_URL', 'http://localhost:4000').replace(/\/+$/, ''),
  busApiKey: str('BUS_API_KEY', 'demo-bus-key'),
  sessionSecret: str('SESSION_SECRET', 'demo-session-secret-change-me'),
  demoOtpCode: str('DEMO_OTP_CODE', '123456'),
  corsOrigin: str('CORS_ORIGIN', 'http://localhost:5173'),
  benefits: {
    tripsAvoided: num('BENEFIT_TRIPS_AVOIDED', 4),
    hoursSaved: num('BENEFIT_HOURS_SAVED', 8),
    costSavedCrc: num('BENEFIT_COST_SAVED_CRC', 50000),
  },
  /** Session token lifetime (8 h). */
  tokenTtlMs: 8 * 60 * 60 * 1000,
  /** OTP challenge lifetime (5 min). */
  otpTtlMs: 5 * 60 * 1000,
  /** Per-call timeout against the bus. */
  busTimeoutMs: 8000,
};

export type Config = typeof config;
