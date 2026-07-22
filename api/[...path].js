// Catch-all Vercel serverless function: every /api/* request is routed here
// and handled by the same Express app used in local dev (server/app.js).
import app from "../server/app.js";

export default app;
