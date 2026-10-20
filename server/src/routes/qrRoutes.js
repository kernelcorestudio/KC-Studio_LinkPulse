// QR code generation: GET /api/qr/:code.png and /api/qr/:code.svg
// Public (no auth): a QR just encodes the already-public short URL; it grants
// no data access. Direct <img>/download-link friendly, so no Bearer header needed.
import { Router } from 'express';
import QRCode from 'qrcode';
import { asyncHandler, HttpError } from '../middleware/errors.js';
import { queryOne } from '../db/index.js';
import { config } from '../config.js';

export const qrRoutes = Router();

// Express 4 binds ':code' before the literal '.png'/'.svg' (params stop at '.').
async function resolveUrl(code) {
  const link = await queryOne('SELECT short_code FROM links WHERE short_code = ?', [code]);
  if (!link) throw new HttpError(404, 'Link not found');
  // ?src=qr so every scan is attributed to the QR source in analytics.
  return `${config.baseUrl}/${code}?src=qr`;
}

function sizeOf(query) {
  const n = Number(query.size) || 320;
  return Math.min(Math.max(n, 64), 2048);
}

qrRoutes.get(
  '/:code.png',
  asyncHandler(async (req, res) => {
    const url = await resolveUrl(req.params.code);
    const buf = await QRCode.toBuffer(url, {
      type: 'png', width: sizeOf(req.query), margin: 2, errorCorrectionLevel: 'M',
    });
    res.set('content-type', 'image/png');
    res.set('cache-control', 'public, max-age=86400');
    res.set('content-disposition', `inline; filename="${req.params.code}-qr.png"`);
    res.send(buf);
  }),
);

qrRoutes.get(
  '/:code.svg',
  asyncHandler(async (req, res) => {
    const url = await resolveUrl(req.params.code);
    const svg = await QRCode.toString(url, {
      type: 'svg', width: sizeOf(req.query), margin: 2, errorCorrectionLevel: 'M',
    });
    res.set('content-type', 'image/svg+xml');
    res.set('cache-control', 'public, max-age=86400');
    res.set('content-disposition', `inline; filename="${req.params.code}-qr.svg"`);
    res.send(svg);
  }),
);
