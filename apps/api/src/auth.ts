import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';
import { config } from './config.js';

// ---------------------------------------------------------------- demo credentials

function sha256(s: string): string {
  return createHash('sha256').update(s).digest('hex');
}

/** cédula → sha256(password). Computed once at startup; plaintext is never compared. */
const CREDENTIALS: ReadonlyMap<string, string> = new Map(
  ['1-2345-6789', '7-0123-0456', '2-0987-0654', '7-0111-0222', '1-1111-2222'].map((id) => [id, sha256('demo')]),
);

export function verifyCredentials(id: string, password: string): boolean {
  const expected = CREDENTIALS.get(id);
  if (!expected) return false;
  const a = Buffer.from(expected, 'hex');
  const b = Buffer.from(sha256(password), 'hex');
  return a.length === b.length && timingSafeEqual(a, b);
}

// ---------------------------------------------------------------- OTP challenges

interface Challenge {
  id: string;
  citizenId: string;
  code: string;
  expiresAt: number;
}

const challenges = new Map<string, Challenge>();

export function createChallenge(citizenId: string): Challenge {
  const c: Challenge = {
    id: 'CH-' + randomBytes(8).toString('hex').toUpperCase(),
    citizenId,
    code: config.demoOtpCode,
    expiresAt: Date.now() + config.otpTtlMs,
  };
  challenges.set(c.id, c);
  return c;
}

export type OtpCheck = { ok: true; citizenId: string } | { ok: false; reason: 'INVALID_OTP' | 'CHALLENGE_EXPIRED' };

export function consumeChallenge(challengeId: string, code: string): OtpCheck {
  const c = challenges.get(challengeId);
  if (!c) return { ok: false, reason: 'CHALLENGE_EXPIRED' };
  if (Date.now() > c.expiresAt) {
    challenges.delete(challengeId);
    return { ok: false, reason: 'CHALLENGE_EXPIRED' };
  }
  if (c.code !== code) return { ok: false, reason: 'INVALID_OTP' };
  challenges.delete(challengeId);
  return { ok: true, citizenId: c.citizenId };
}

export function resetChallenges(): void {
  challenges.clear();
}

// ---------------------------------------------------------------- signed tokens

export interface TokenPayload {
  sub: string;
  exp: number; // epoch ms
}

function sign(data: string): string {
  return createHmac('sha256', config.sessionSecret).update(data).digest('base64url');
}

export function issueToken(sub: string, now = Date.now()): string {
  const payload: TokenPayload = { sub, exp: now + config.tokenTtlMs };
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${body}.${sign(body)}`;
}

export type TokenCheck = { ok: true; payload: TokenPayload } | { ok: false; reason: 'UNAUTHENTICATED' | 'TOKEN_EXPIRED' };

export function verifyToken(token: string, now = Date.now()): TokenCheck {
  const parts = token.split('.');
  if (parts.length !== 2) return { ok: false, reason: 'UNAUTHENTICATED' };
  const [body, sig] = parts as [string, string];
  const expected = Buffer.from(sign(body));
  const given = Buffer.from(sig);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return { ok: false, reason: 'UNAUTHENTICATED' };
  let payload: TokenPayload;
  try {
    payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as TokenPayload;
  } catch {
    return { ok: false, reason: 'UNAUTHENTICATED' };
  }
  if (typeof payload.sub !== 'string' || typeof payload.exp !== 'number') return { ok: false, reason: 'UNAUTHENTICATED' };
  if (now > payload.exp) return { ok: false, reason: 'TOKEN_EXPIRED' };
  return { ok: true, payload };
}

// ---------------------------------------------------------------- middleware

export interface AuthedRequest extends Request {
  citizenId: string;
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const header = req.header('authorization') ?? '';
  const m = /^Bearer\s+(.+)$/i.exec(header);
  if (!m) {
    res.status(401).json({ error: { code: 'UNAUTHENTICATED', message: 'Debe iniciar sesión para continuar' } });
    return;
  }
  const check = verifyToken(m[1]!.trim());
  if (!check.ok) {
    const message = check.reason === 'TOKEN_EXPIRED' ? 'La sesión expiró; inicie sesión de nuevo' : 'Sesión inválida';
    res.status(401).json({ error: { code: check.reason, message } });
    return;
  }
  (req as AuthedRequest).citizenId = check.payload.sub;
  next();
}

export function citizenOf(req: Request): string {
  return (req as AuthedRequest).citizenId;
}
