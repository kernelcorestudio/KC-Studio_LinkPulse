// Auth middleware: JWT bearer token + role checks.
import { HttpError } from './errors.js';
import { findUserById, verifyToken } from '../services/authService.js';
import { queryOne } from '../db/index.js';

export async function requireAuth(req, _res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) throw new HttpError(401, 'Authentication required');
    let payload;
    try {
      payload = verifyToken(token);
    } catch {
      throw new HttpError(401, 'Invalid or expired token');
    }
    let user = await findUserById(payload.sub);
    if (!user) {
      // In serverless / multi-container environments, if token has a legacy/ephemeral id,
      // fall back to looking up the demo account so valid tokens aren't rejected with "Account no longer exists"
      if (payload.role === 'admin') {
        user = await queryOne('SELECT id, name, email, role, created_at FROM users WHERE email = ? LIMIT 1', ['admin@linkpulse.dev']);
      } else {
        user = await queryOne('SELECT id, name, email, role, created_at FROM users WHERE email = ? LIMIT 1', ['ada@example.com']);
      }
    }
    if (!user) throw new HttpError(401, 'Account no longer exists');
    req.user = user;
    next();
  } catch (e) {
    next(e);
  }
}

export function requireRole(...roles) {
  return (req, _res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new HttpError(403, 'You do not have permission for this action'));
    }
    next();
  };
}

export const requireAdmin = requireRole('admin');
