"use strict";

// Minimal API client for the Node/Express backend.
function getSessionRaw() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (_) {
    return null;
  }
}

function setSessionRaw(session) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

function clearSessionRaw() {
  localStorage.removeItem(SESSION_KEY);
}

function getToken() {
  const session = getSessionRaw();
  return session && session.token ? String(session.token) : "";
}

async function apiFetch(path, options) {
  const opts = options || {};
  const headers = Object.assign({}, opts.headers || {});
  if (opts.body) headers["Content-Type"] = "application/json";
  const token = getToken();
  if (token) headers.Authorization = "Bearer " + token;

  const url = API_BASE_URL + path;
  const res = await fetch(url, Object.assign({}, opts, { headers }));
  const contentType = String(res.headers.get("content-type") || "");
  const data = contentType.includes("application/json") ? await res.json() : null;

  if (!res.ok) {
    const message = data && data.error ? data.error : "Error HTTP " + String(res.status);
    const err = new Error(message);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}

async function login(email, password) {
  const data = await apiFetch("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: email, password: password })
  });
  setSessionRaw({ token: data.token, user: data.user });
  return data.user;
}

async function register(name, email, password) {
  const data = await apiFetch("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ name: name, email: email, password: password })
  });
  setSessionRaw({ token: data.token, user: data.user });
  return data.user;
}

async function logout() {
  try {
    await apiFetch("/api/auth/logout", { method: "POST" });
  } catch (_) {
    // Ignore network errors; session is client-side.
  }
  clearSessionRaw();
}

const api = {
  auth: { login: login, register: register, logout: logout },
  members: {
    list: function () {
      return apiFetch("/api/members");
    },
    create: function (payload) {
      return apiFetch("/api/members", { method: "POST", body: JSON.stringify(payload) });
    },
    update: function (id, payload) {
      return apiFetch("/api/members/" + encodeURIComponent(id), {
        method: "PUT",
        body: JSON.stringify(payload)
      });
    },
    remove: function (id) {
      return apiFetch("/api/members/" + encodeURIComponent(id), { method: "DELETE" });
    }
  },
  transactions: {
    list: function () {
      return apiFetch("/api/transactions");
    },
    create: function (payload) {
      return apiFetch("/api/transactions", { method: "POST", body: JSON.stringify(payload) });
    },
    update: function (id, payload) {
      return apiFetch("/api/transactions/" + encodeURIComponent(id), {
        method: "PUT",
        body: JSON.stringify(payload)
      });
    },
    remove: function (id) {
      return apiFetch("/api/transactions/" + encodeURIComponent(id), { method: "DELETE" });
    }
  },
  budgets: {
    list: function () {
      return apiFetch("/api/budgets");
    },
    create: function (payload) {
      return apiFetch("/api/budgets", { method: "POST", body: JSON.stringify(payload) });
    },
    update: function (id, payload) {
      return apiFetch("/api/budgets/" + encodeURIComponent(id), {
        method: "PUT",
        body: JSON.stringify(payload)
      });
    },
    remove: function (id) {
      return apiFetch("/api/budgets/" + encodeURIComponent(id), { method: "DELETE" });
    }
  }
};
