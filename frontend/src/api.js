function csrfToken() {
  const match = document.cookie.match(/(?:^|; )csrftoken=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : "";
}

let pending = 0;
const listeners = new Set();

function notifyPending() {
  listeners.forEach((fn) => fn(pending));
}

export function subscribePending(fn) {
  listeners.add(fn);
  fn(pending);
  return () => listeners.delete(fn);
}

const API_ORIGIN = String(import.meta.env.VITE_API_ORIGIN || "").replace(
  /\/$/,
  ""
);

function apiUrl(path) {
  if (!API_ORIGIN) return path;
  return `${API_ORIGIN}${path.startsWith("/") ? path : `/${path}`}`;
}

async function request(url, options = {}) {
  const { silent = false, ...fetchOptions } = options;
  const method = fetchOptions.method || "GET";
  const headers = {
    "Content-Type": "application/json",
    ...(fetchOptions.headers || {}),
  };
  if (method !== "GET") {
    headers["X-CSRFToken"] = csrfToken();
  }
  if (!silent) {
    pending += 1;
    notifyPending();
  }
  try {
    const response = await fetch(apiUrl(url), {
      credentials: "include",
      ...fetchOptions,
      headers,
    });
    const text = await response.text();
    const trimmed = text.trim();
    let body = null;
    if (trimmed) {
      try {
        body = JSON.parse(trimmed);
      } catch {
        if (trimmed.startsWith("<!DOCTYPE") || trimmed.startsWith("<html")) {
          throw new Error(
            "API is missing on this host (got an HTML page instead of JSON). Vercel only serves the frontend — deploy the Django backend (Render/Railway/Fly) or set VITE_API_ORIGIN to your API URL."
          );
        }
        throw new Error("Server returned a non-JSON response.");
      }
    }
    if (!response.ok) {
      throw new Error(body?.error || "Request failed");
    }
    return body ?? {};
  } finally {
    if (!silent) {
      pending = Math.max(0, pending - 1);
      notifyPending();
    }
  }
}

export const api = {
  me: () => request("/api/me/"),
  register: (payload) =>
    request("/api/register/", { method: "POST", body: JSON.stringify(payload) }),
  login: (payload) =>
    request("/api/login/", { method: "POST", body: JSON.stringify(payload) }),
  logout: () => request("/api/logout/", { method: "POST", body: "{}" }),
  bootstrap: (options = {}) =>
    request("/api/bootstrap/", { silent: Boolean(options.silent) }),
  getSgCalc: () => request("/api/sg-calculator/"),
  saveSgCalc: (state) =>
    request("/api/sg-calculator/", {
      method: "PUT",
      silent: true,
      body: JSON.stringify({ state }),
    }),
  getStatCalc: () => request("/api/stat-calculator/"),
  saveStatCalc: (state) =>
    request("/api/stat-calculator/", {
      method: "PUT",
      silent: true,
      body: JSON.stringify({ state }),
    }),
  createOption: (payload) =>
    request("/api/options/", { method: "POST", body: JSON.stringify(payload) }),
    updateOption: (id, payload, options = {}) =>
    request(`/api/options/${id}/`, {
      method: "PATCH",
      silent: Boolean(options.silent),
      body: JSON.stringify(payload),
    }),
  deleteOption: (id) => request(`/api/options/${id}/`, { method: "DELETE" }),
  rateOption: (id, score) =>
    request(`/api/options/${id}/rate/`, {
      method: "PUT",
      body: JSON.stringify({ score }),
    }),
  createCase: (payload) =>
    request("/api/cases/", { method: "POST", body: JSON.stringify(payload) }),
  updateCase: (id, payload, options = {}) =>
    request(`/api/cases/${id}/`, {
      method: "PATCH",
      silent: Boolean(options.silent),
      body: JSON.stringify(payload),
    }),
  deleteCase: (id) => request(`/api/cases/${id}/`, { method: "DELETE" }),
  rateCase: (id, score) =>
    request(`/api/cases/${id}/rate/`, {
      method: "PUT",
      body: JSON.stringify({ score }),
    }),
  createEvent: (payload) =>
    request("/api/events/", { method: "POST", body: JSON.stringify(payload) }),
};
