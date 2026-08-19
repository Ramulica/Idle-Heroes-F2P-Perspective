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
    const response = await fetch(url, {
      credentials: "include",
      ...fetchOptions,
      headers,
    });
    const body = await response.json();
    if (!response.ok) {
      throw new Error(body.error || "Request failed");
    }
    return body;
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
  bootstrap: () => request("/api/bootstrap/"),
  getSgCalc: () => request("/api/sg-calculator/"),
  saveSgCalc: (state) =>
    request("/api/sg-calculator/", {
      method: "PUT",
      silent: true,
      body: JSON.stringify({ state }),
    }),
  createOption: (payload) =>
    request("/api/options/", { method: "POST", body: JSON.stringify(payload) }),
  updateOption: (id, payload) =>
    request(`/api/options/${id}/`, {
      method: "PATCH",
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
  updateCase: (id, payload) =>
    request(`/api/cases/${id}/`, {
      method: "PATCH",
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
