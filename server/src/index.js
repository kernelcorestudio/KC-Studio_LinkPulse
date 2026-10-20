// Server entry: init DB, start async click queue, graceful shutdown.
import { config } from './config.js';
import { initDb, closeDb } from './db/index.js';
import { createApp } from './app.js';
import { startClickQueue, shutdownClickQueue } from './services/clickQueue.js';

await initDb();

if (!process.env.VERCEL) {
  startClickQueue();
}

const app = createApp();

if (!process.env.VERCEL) {
  const server = app.listen(config.port, () => {
    console.log(`[linkpulse] API listening on ${config.baseUrl} (port ${config.port})`);
  });

  let shuttingDown = false;
  async function shutdown(signal) {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log(`[linkpulse] ${signal} received - flushing click queue...`);
    server.close();
    try {
      await shutdownClickQueue(); // flush queued clicks before exit
      await closeDb();
    } catch (e) {
      console.error('[linkpulse] shutdown error:', e.message);
    }
    process.exit(0);
  }
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('uncaughtException', (e) => {
    console.error('[linkpulse] uncaught:', e);
    void shutdown('uncaughtException');
  });
}

export default app;
