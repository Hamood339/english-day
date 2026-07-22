// Single serverless function for every flat /api/<route> path (Hobby plan
// caps Serverless Functions at 12, so one dynamic-segment file replaces the
// 13 separate ones). Express still does the real routing internally.
export { default } from "../server/app.js";
