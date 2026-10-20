// Express application factory & Vercel serverless entrypoint compatibility.
// When Vercel discovers src/app.js as the Express framework entrypoint,
// exporting the initialized app as default ensures serverless functions
// start correctly with database initialized.
export { createApp } from './createApp.js';
import app from './index.js';

export default app;
