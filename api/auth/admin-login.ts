import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyPassword, createAdminToken } from '../../lib/auth.js';
import { getEnv } from '../../lib/env.js';
import { getClientIP, rateLimitOrReject, RATE_LIMITS } from '../../lib/rate-limit.js';
import type { AdminLoginPayload } from '../../shared/types.js';

async function verifyGoogleToken(credential: string): Promise<{ email: string } | null> {
  try {
    const res = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`);
    if (!res.ok) return null;
    const data = await res.json();
    // Verify the token is for our app
    const expectedClientId = getEnv('GOOGLE_CLIENT_ID');
    if (expectedClientId && data.aud !== expectedClientId) return null;
    if (!data.email || data.email_verified !== 'true') return null;
    return { email: data.email };
  } catch {
    return null;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed', code: 'METHOD_NOT_ALLOWED' });
  }

  const ip = getClientIP(req);
  if (rateLimitOrReject(ip, RATE_LIMITS.adminLogin, res)) return;

  try {
    const body = req.body as AdminLoginPayload;

    // ── Google Sign-In flow ──
    if (body.google_credential) {
      const googleUser = await verifyGoogleToken(body.google_credential);
      if (!googleUser) {
        return res.status(401).json({ error: 'Invalid Google credential', code: 'UNAUTHORIZED' });
      }

      const adminEmail = getEnv('ADMIN_EMAIL');
      if (!adminEmail || googleUser.email.toLowerCase() !== adminEmail.toLowerCase()) {
        return res.status(401).json({ error: 'Not an authorized admin', code: 'UNAUTHORIZED' });
      }

      const token = createAdminToken();
      return res.status(200).json({ token });
    }

    // ── Legacy username/password flow (fallback) ──
    if (!body.username || !body.password) {
      return res.status(400).json({ error: 'Username and password required', code: 'BAD_REQUEST' });
    }

    const adminUsername = getEnv('ADMIN_USERNAME');
    const adminPasswordHash = getEnv('ADMIN_PASSWORD_HASH');

    if (body.username !== adminUsername) {
      return res.status(401).json({ error: 'Invalid credentials', code: 'UNAUTHORIZED' });
    }

    const valid = await verifyPassword(body.password, adminPasswordHash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials', code: 'UNAUTHORIZED' });
    }

    const token = createAdminToken();
    return res.status(200).json({ token });
  } catch (err) {
    const { logger } = await import('../../lib/logger.js');
    logger.error('Admin login error', { endpoint: 'admin-login', error: err });
    return res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' });
  }
}
