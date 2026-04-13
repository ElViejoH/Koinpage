"use strict";

// ===== Session routing =====
// Controla redirecciones por sesión y decide qué página protegida inicializar.
function initSessionFlow() {
  const page = document.body.dataset.page || "";
  const session = getSession();
  const protectedPages = ["dashboard", "members", "transactions", "budgets"];

  if (protectedPages.includes(page) && !session) {
    window.location.href = "login.html";
    return;
  }

  if (page === "login" && session) {
    window.location.href = "dashboard.html";
    return;
  }

  if (protectedPages.includes(page) && session) {
    bindHeaderSession(session);
  }

  if (page === "dashboard" && session) {
    initDashboard();
  }

  if (page === "members" && session) {
    initMembersPage();
  }

  if (page === "transactions" && session) {
    initTransactionsPage();
  }

  if (page === "budgets" && session) {
    initBudgetsPage();
  }
}

function getSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (_) {
    return null;
  }
}

function bindHeaderSession(session) {
  const emailLabel = document.querySelector("#session-email");
  if (emailLabel) {
    emailLabel.textContent = "Hola, " + getNameFromSession(session);
  }

  const logoutButton = document.querySelector("[data-logout]");
  if (logoutButton) {
    logoutButton.addEventListener("click", function () {
      localStorage.removeItem(SESSION_KEY);
      window.location.href = "login.html";
    });
  }
}
