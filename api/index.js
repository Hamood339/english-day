// Single Vercel serverless function handling all /api/* requests (see the
// "rewrites" rule in vercel.json), using the same Express app as local dev.
import app from "../server/app.js";

export default app;
