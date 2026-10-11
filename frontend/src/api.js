const KEY = "wg_token";

export function getApiBase() {
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    if (host === "localhost" || host === "127.0.0.1") return "";
  }
  return String(import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
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
