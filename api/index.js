// Vercel Serverless Function entry point for LinkPulse
import { createApp } from '../server/src/app.js';
import { initDb } from '../server/src/db/index.js';

let appInstance = null;
let initPromise = null;

async function getApp() {
  if (!initPromise) {
    initPromise = (async () => {
      await initDb();
      return createApp();
    })();
  }
  return initPromise;
}

export default async function handler(req, res) {
  try {
    const app = await getApp();
    return app(req, res);
  } catch (err) {
    console.error('[vercel] Serverless handler error:', err);
    res.status(500).json({ error: 'Internal Server Error', message: err.message });
  }
}
