"use strict";

const SESSION_KEY = "ff_session";
const STORAGE_BUDGET_WARNING_DISMISSED = "ff_budget_warning_dismissed";
const STORAGE_BUDGET_WARNING_DISABLED = "ff_budget_warning_disabled";
const STORAGE_REGISTERED_USERS = "ff_registered_users";
const DEFAULT_LOCAL_API_URL = "http://localhost:3000";

function normalizeApiBaseUrl(value) {
  const normalized = String(value || "").trim();
  if (!normalized) return "";
  return normalized.replace(/\/+$/, "");
}

function resolveApiBaseUrl() {
  const runtimeConfig = window.APP_CONFIG || {};
  const configured = normalizeApiBaseUrl(runtimeConfig.apiBaseUrl);
  if (configured) return configured;

  const hostname = String(window.location.hostname || "").toLowerCase();
  const isLocalhost = hostname === "localhost" || hostname === "127.0.0.1";
  if (isLocalhost && window.location.port !== "3000") {
    return DEFAULT_LOCAL_API_URL;
  }

  return normalizeApiBaseUrl(window.location.origin);
}

const API_BASE_URL = resolveApiBaseUrl();
