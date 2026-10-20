// JWT + bcrypt helpers. bcryptjs is API-compatible with bcrypt (pure-JS install,
// no native build - keeps Render/CI deployments dependency-light).
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { nanoid } from 'nanoid';
import { config } from '../config.js';
import { queryOne, run } from '../db/index.js';

export const hashPassword = (pw) => bcrypt.hash(pw, 10);
export const verifyPassword = (pw, hash) => bcrypt.compare(pw, hash);

export function signToken(user) {
  // role is embedded; admin middleware also re-reads the user row on sensitive ops.
  return jwt.sign({ sub: user.id, role: user.role }, config.jwtSecret, { expiresIn: '7d' });
}

export function verifyToken(token) {
  return jwt.verify(token, config.jwtSecret);
}

export async function findUserById(id) {
  return queryOne('SELECT id, name, email, role, created_at FROM users WHERE id = ?', [id]);
}

export function publicUser(u) {
  if (!u) return null;
  const { password_hash, ...rest } = u; // never expose the hash
  return rest;
}

export async function upsertGoogleUser({ email, name }) {
  const cleanEmail = email.toLowerCase().trim();
  let user = await queryOne('SELECT * FROM users WHERE LOWER(email) = LOWER(?)', [cleanEmail]);
  if (!user) {
    const id = nanoid();
    const now = new Date().toISOString();
    const randomSecret = nanoid(32);
    const hash = await hashPassword(randomSecret);
    const anyUser = await queryOne('SELECT id FROM users LIMIT 1');
    const role = anyUser ? 'user' : 'admin';
    const userName = (name || cleanEmail.split('@')[0]).trim() || 'Google User';
    await run(
      'INSERT INTO users (id, name, email, password_hash, role, created_at) VALUES (?,?,?,?,?,?)',
      [id, userName, cleanEmail, hash, role, now],
    );
    user = { id, name: userName, email: cleanEmail, role, created_at: now };
  }
  return { token: signToken(user), user: publicUser(user) };
}

