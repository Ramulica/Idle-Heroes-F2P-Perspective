function csrfToken() {
  const match = document.cookie.match(/(?:^|; )csrftoken=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : "";
}

async function request(url, options = {}) {
  const method = options.method || "GET";
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };
  if (method !== "GET") {
    headers["X-CSRFToken"] = csrfToken();
  }
  const response = await fetch(url, {
    credentials: "include",
    headers,
    ...options,
  });
  const body = await response.json();
  if (!response.ok) {
    throw new Error(body.error || "Request failed");
  }
  return body;
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
};
