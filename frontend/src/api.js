const KEY = "wg_token";
const API_KEY = "wg_api";

function captureApiFromUrl() {
  if (typeof window === "undefined") return;
  const q = new URLSearchParams(window.location.search).get("api");
  if (q) {
    localStorage.setItem(API_KEY, q.replace(/\/$/, ""));
    const url = new URL(window.location.href);
    url.searchParams.delete("api");
    window.history.replaceState({}, "", url.pathname + url.search + url.hash);
  }
}
captureApiFromUrl();

export function getApiBase() {
  const stored = localStorage.getItem(API_KEY);
  const env = import.meta.env.VITE_API_URL || "";
  return String(stored || env).replace(/\/$/, "");
}

export function setApiBase(url) {
  const clean = String(url || "").replace(/\/$/, "");
  if (clean) localStorage.setItem(API_KEY, clean);
  else localStorage.removeItem(API_KEY);
}

export function getToken() {
  return localStorage.getItem(KEY);
}

export function setSession(token, user) {
  localStorage.setItem(KEY, token);
  localStorage.setItem("wg_user", JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem(KEY);
  localStorage.removeItem("wg_user");
}

export function currentUser() {
  try {
    return JSON.parse(localStorage.getItem("wg_user") || "null");
  } catch {
    return null;
  }
}

export async function api(path, { method = "GET", body } = {}) {
  const url = `${getApiBase()}${path}`;
  const res = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      "ngrok-skip-browser-warning": "true",
      ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (res.status === 401) {
    clearSession();
    if (!path.includes("/auth/login")) window.location.href = "/login";
  }
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

export const inr = (n) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(
    Number(n) || 0
  );
