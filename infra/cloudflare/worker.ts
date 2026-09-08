/**
 * Cloudflare Worker in front of the all-in-one portal container (docs/DEPLOY.md §2, option C).
 *
 * The container is the same image the Compose stack and CI use: one Node process running the bus,
 * the thirteen agency apps and the portal API. The Worker does nothing but hand the request to it
 * and let it sleep when nobody is looking, which is what keeps the demo inside the allowance that
 * comes with the $5/month Workers Paid plan.
 */
import { Container, getContainer } from '@cloudflare/containers';

export class PortalContainer extends Container {
  /** scripts/serve-all.mjs listens here; only this port is exposed. */
  defaultPort = 8080;

  /**
   * Idle timeout. The demo is bursty — a minister opens it, clicks through one trámite, leaves —
   * so a short sleep keeps billed time close to actual use. Waking costs the visitor a few seconds,
   * which the static site warns about before sending anyone here.
   */
  sleepAfter = '10m';

  envVars = {
    AGENCY_LATENCY_MS: '150',
    NODE_ENV: 'production',
  };
}

export default {
  async fetch(request: Request, env: { PORTAL: DurableObjectNamespace<PortalContainer> }): Promise<Response> {
    // One shared instance: the demo has no per-user state worth isolating, and a single instance
    // keeps both the bill and the audit log coherent.
    return getContainer(env.PORTAL).fetch(request);
  },
};
