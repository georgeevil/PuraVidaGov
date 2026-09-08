/// <reference types="vite/client" />

/**
 * Build-time flags (docs/CONTRACTS.md v4 → "Static build"). Both are optional: unset means the default
 * deployment, a real backend behind relative `/api/...` URLs.
 */
interface ImportMetaEnv {
  /** `'static'` builds the no-backend bundle served by Cloudflare Pages / Netlify / GitHub Pages. */
  readonly VITE_DEPLOY_MODE?: string;
  /** Absolute URL of the interactive (all-in-one) deployment the static site links out to. */
  readonly VITE_PORTAL_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
