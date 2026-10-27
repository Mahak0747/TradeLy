import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const API = process.env.VITE_DEV_API_TARGET || "http://localhost:3002";
const proxied = ["/api", "/orders", "/funds", "/allHoldings", "/allPositions", "/newOrder", "/marketIndices"];

// In development the browser talks to the Vite server and Vite forwards API calls to the backend,
// so no VITE_API_BASE_URL (and no CORS) is needed locally.
export default defineConfig({
  plugins: [react()],
  server: { proxy: Object.fromEntries(proxied.map((p) => [p, { target: API, changeOrigin: true }])) },
});
