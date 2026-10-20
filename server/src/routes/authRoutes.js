// /api/auth - register, login, me.
import { Router } from 'express';
import { nanoid } from 'nanoid';
import { queryOne, run } from '../db/index.js';
import { asyncHandler, HttpError } from '../middleware/errors.js';
import { requireAuth } from '../middleware/auth.js';
import { registerSchema, loginSchema } from '../utils/validation.js';
import { hashPassword, verifyPassword, signToken, publicUser, upsertGoogleUser } from '../services/authService.js';

export const authRoutes = Router();

authRoutes.post(
  '/google',
  asyncHandler(async (req, res) => {
    const { credential, email, name } = req.body || {};
    let userEmail = email;
    let userName = name;

    // Mode A: Real Google ID Token
    if (credential && typeof credential === 'string') {
      try {
        const parts = credential.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
          if (payload && payload.email) {
            userEmail = payload.email;
            userName = payload.name || payload.given_name || userName;
          }
        }
      } catch {
        // Fallback to provided email/name if token decoding fails
      }
    }

    if (!userEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(userEmail).trim())) {
      throw new HttpError(400, 'A valid Google email address is required');
    }

    const result = await upsertGoogleUser({ email: userEmail, name: userName });
    res.json(result);
  }),
);

authRoutes.post(
  '/register',
  asyncHandler(async (req, res) => {
    const data = registerSchema.parse(req.body);
    const existing = await queryOne('SELECT id FROM users WHERE email = ?', [data.email]);
    if (existing) throw new HttpError(409, 'An account with this email already exists');

    const id = nanoid();
    const now = new Date().toISOString();
    const hash = await hashPassword(data.password);
    // First registered account becomes the admin so the demo has one out of the box.
    const anyUser = await queryOne('SELECT id FROM users LIMIT 1');
    const role = anyUser ? 'user' : 'admin';
    await run(
      'INSERT INTO users (id, name, email, password_hash, role, created_at) VALUES (?,?,?,?,?,?)',
      [id, data.name, data.email, hash, role, now],
    );
    const user = { id, name: data.name, email: data.email, role, created_at: now };
    res.status(201).json({ token: signToken(user), user });
  }),
);

authRoutes.post(
  '/login',
  asyncHandler(async (req, res) => {
    const data = loginSchema.parse(req.body);
    const user = await queryOne('SELECT * FROM users WHERE email = ?', [data.email]);
    if (!user || !(await verifyPassword(data.password, user.password_hash))) {
      throw new HttpError(401, 'Invalid email or password');
    }
    res.json({ token: signToken(user), user: publicUser(user) });
  }),
);

authRoutes.get(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    res.json({ user: req.user });
  }),
);
