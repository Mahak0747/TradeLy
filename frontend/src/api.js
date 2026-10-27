import axios from "axios";

// Dev: empty base URL -> relative requests -> Vite proxy -> backend. Production: set VITE_API_BASE_URL.
const baseURL = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

if (import.meta.env.PROD && !baseURL) {
  console.error("VITE_API_BASE_URL is not set: API calls will go to the frontend's own origin and fail.");
}

const api = axios.create({ baseURL, timeout: 30000 }); // generous: free hosts need up to ~50s to wake up

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export function clearSession() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}

const RETRY_STATUS = new Set([502, 503, 504]);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

api.interceptors.response.use(
  (res) => {
    // A misconfigured base URL returns the SPA's index.html with status 200 - fail loudly instead of crashing on .map()
    if (String(res.headers?.["content-type"] || "").includes("text/html")) {
      const err = new Error("The API returned a web page instead of data. Check VITE_API_BASE_URL.");
      err.isConfigError = true;
      return Promise.reject(err);
    }
    return res;
  },
  async (err) => {
    if (axios.isCancel(err)) return Promise.reject(err);
    const cfg = err.config;
    const status = err.response?.status;

    if (status === 401 && !String(cfg?.url || "").includes("/api/auth/")) {
      clearSession(); // expired / invalid token: previously this only logged to the console and left an empty dashboard
      if (!window.location.pathname.startsWith("/login")) window.location.assign("/login?expired=1");
      return Promise.reject(err);
    }

    // Idempotent GETs are retried on network errors / timeouts / 502-504 (cold start, deploy, blip)
    const retryable = cfg && (cfg.method || "get") === "get" && (!err.response || RETRY_STATUS.has(status));
    cfg.__retries = cfg.__retries || 0;
    if (retryable && cfg.__retries < 2) {
      cfg.__retries += 1;
      await sleep(1000 * cfg.__retries);
      return api(cfg);
    }
    return Promise.reject(err);
  }
);

export function errorMessage(err) {
  if (err?.isConfigError) return err.message;
  const data = err?.response?.data;
  if (data && typeof data === "object" && (data.message || data.error)) return data.message || data.error;
  if (err?.code === "ECONNABORTED") return "The server is taking too long to respond. It may be waking up - please retry.";
  if (!err?.response) return "Cannot reach the server. Check your connection and try again.";
  if ([502, 503, 504].includes(err.response.status)) return "The server is unavailable or still starting up. Please retry in a few seconds.";
  return `Request failed (${err.response.status})`;
}

export default api;
