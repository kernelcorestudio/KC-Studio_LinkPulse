// JWT + bcrypt helpers. bcryptjs is API-compatible with bcrypt (pure-JS install,
// no native build - keeps Render/CI deployments dependency-light).
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { queryOne } from '../db/index.js';

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
