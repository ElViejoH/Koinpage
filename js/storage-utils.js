"use strict";

// ===== Storage, calculations and formatting =====
// Incluye helpers de persistencia, cálculos financieros, fechas y formato de texto/moneda.
function loadList(key) {
  try {
    const raw = localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (_) {
    return [];
  }
}

function saveList(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function computeBalance(transactions) {
  return transactions.reduce(function (sum, item) {
    const amount = Number(item.amount) || 0;
    return item.type === "income" ? sum + amount : sum - amount;
  }, 0);
}

function setText(selector, value) {
  const node = document.querySelector(selector);
  if (node) node.textContent = value;
}

function money(value) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(Number(value) || 0);
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function currentMonthIso() {
  return new Date().toISOString().slice(0, 7);
}

function prettyMonth(monthIso) {
  const parts = String(monthIso).split("-");
  if (parts.length !== 2) return monthIso;
  const year = Number(parts[0]);
  const month = Number(parts[1]) - 1;
  const date = new Date(year, month, 1);
  return date.toLocaleDateString("es-CO", { month: "long", year: "numeric" });
}

function last7Days() {
  const labels = ["dom", "lun", "mar", "mie", "jue", "vie", "sab"];
  const days = [];
  const now = new Date();
  for (let i = 6; i >= 0; i -= 1) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const iso = d.toISOString().slice(0, 10);
    days.push({ date: iso, label: labels[d.getDay()] });
  }
  return days;
}

function getNameFromSession(session) {
  if (!session) return "usuario";
  if (session.user && session.user.name) return session.user.name;
  if (session.user && session.user.email) return String(session.user.email).split("@")[0];
  if (session.email) return String(session.email).split("@")[0];
  return "usuario";
}

function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
