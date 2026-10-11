const KEY = "wg_token";

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
  const res = await fetch(path, {
    method,
    headers: {
      "Content-Type": "application/json",
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
