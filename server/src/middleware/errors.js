// Central error handling: HttpError + asyncHandler wrapper + 404 + final handler.
export class HttpError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    if (details) this.details = details;
  }
}

// Wrap async route handlers so thrown errors reach the central handler.
export const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

export function notFoundHandler(req, _res, next) {
  next(new HttpError(404, `Not found: ${req.method} ${req.path}`));
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, _req, res, _next) {
  // Zod errors -> 400 with field details
  if (err?.name === 'ZodError') {
    return res.status(400).json({ error: 'Validation failed', details: err.issues?.map((i) => ({ path: i.path.join('.'), message: i.message })) });
  }
  const status = err.status || err.statusCode || 500;
  if (status >= 500) console.error('[error]', err);
  res.status(status).json({ error: status >= 500 ? 'Internal server error' : err.message });
}
