// Express app assembly: security middleware, routes, central error handling.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { config } from './config.js';
import { authRoutes } from './routes/authRoutes.js';
import { linkRoutes } from './routes/linkRoutes.js';
import { analyticsRoutes } from './routes/analyticsRoutes.js';
import { campaignRoutes, tagRoutes, folderRoutes } from './routes/orgRoutes.js';
import { qrRoutes } from './routes/qrRoutes.js';
import { adminRoutes } from './routes/adminRoutes.js';
import { bioRoutes, publicBioRouter } from './routes/bioRoutes.js';
import { redirectRouter } from './routes/redirectRoutes.js';
import { notFoundHandler, errorHandler } from './middleware/errors.js';

export function createApp() {
  const app = express();
  app.set('trust proxy', 1); // correct client IP behind Render/nginx/Vercel
  app.disable('x-powered-by');

  app.use(
    helmet({
      // Redirect engine serves small branded pages with inline <style>.
      contentSecurityPolicy: {
        directives: { defaultSrc: ["'self'"], styleSrc: ["'self'", "'unsafe-inline'"] },
      },
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );

  // CORS: allow no-origin (curl, QR scanners, direct navigations), configured
  // frontend origins, AND same-origin (single-service deploy where the server
  // also hosts the SPA and Vite loads assets in crossorigin/module mode).
  const sendCors = cors({ credentials: true });
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    const self = `${req.protocol}://${req.get('host')}`;
    const isVercel = origin && (origin.endsWith('.vercel.app') || origin.includes('vercel.app'));
    if (!origin || origin === self || config.clientOrigins.includes(origin) || isVercel) {
      return sendCors(req, res, next);
    }
    next();
  });

  app.use(express.json({ limit: '1mb' })); // sized for 500-row CSV import payloads (importLimiter guards abuse)
  app.use(express.urlencoded({ extended: true })); // password form (Phase 2)
  app.use(cookieParser());

  // Global safety net for the API surface.
  app.use('/api', rateLimit({ windowMs: 60_000, limit: 300, standardHeaders: 'draft-7', legacyHeaders: false }));

  const authLimiter = rateLimit({
    windowMs: 15 * 60_000,
    limit: 60,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    keyGenerator: (req) => req.ip,
    message: { error: 'Too many auth attempts - try again in 15 minutes' },
  });
  app.use('/api/auth', authLimiter);

  app.get('/api/health', (_req, res) => res.json({ ok: true, service: 'linkpulse-api', time: new Date().toISOString() }));

  app.use('/api/auth', authRoutes);
  app.use('/api/links', linkRoutes);
  app.use('/api/analytics', analyticsRoutes);
  app.use('/api/campaigns', campaignRoutes);
  app.use('/api/tags', tagRoutes);
  app.use('/api/folders', folderRoutes);
  app.use('/api/qr', qrRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/bio', bioRoutes);

  // Public link-in-bio pages: /bio/:slug (server-rendered). MUST be mounted
  // before the redirect engine, which owns GET /:code at the root.
  app.use(publicBioRouter);

  // Static SPA assets (e.g. /logo.png, /favicon.ico, /assets/*, /linkpulse.mp4)
  const dist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../client/dist');
  if (fs.existsSync(dist)) {
    app.use(express.static(dist));
  }

  // Short-link redirect engine lives at the root: GET /:code
  app.use(redirectRouter);

  // Fallback for HTML5 client-side routing
  if (fs.existsSync(dist)) {
    app.get(/^\/(?!api\/).*/, (_req, res) => res.sendFile(path.join(dist, 'index.html')));
  }

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
