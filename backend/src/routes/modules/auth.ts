import { Router } from 'express';
import { prisma } from '../../lib/prisma.js';
import bcrypt from 'bcryptjs';
import { signJwt } from '../../lib/auth.js';

export const router = Router();

/**
 * POST /api/v1/auth/login
 * body: { email, password }
 */
router.post('/login', async (req, res) => {
  const { email, password } = req.body as { email: string; password: string };
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
  const token = signJwt({ userId: user.id, role: user.role });
  res.json({ token, role: user.role });
});

/**
 * POST /api/v1/auth/oauth/token - OAuth2 mock (client_credentials)
 */
router.post('/oauth/token', (req, res) => {
  const { client_id, client_secret } = req.body || {};
  if (client_id === process.env.OAUTH_CLIENT_ID && client_secret === process.env.OAUTH_CLIENT_SECRET) {
    const token = signJwt({ userId: 'oauth-client', role: 'ADMIN' });
    return res.json({ access_token: token, token_type: 'bearer', expires_in: 28800 });
  }
  return res.status(401).json({ error: 'invalid_client' });
});