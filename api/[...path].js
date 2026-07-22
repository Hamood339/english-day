// Vercel's native catch-all convention: this one function handles every
// /api/* request without needing a custom "rewrites" rule in vercel.json.
import app from "../server/app.js";

export default app;
