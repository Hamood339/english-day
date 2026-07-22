// Local development entry point only. On Vercel, api/[...path].js imports
// server/app.js directly as a serverless function — this file never runs there.
import app from "./app.js";

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`English Day Challenge API listening on port ${PORT}`);
});
