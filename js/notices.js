"use strict";

// ===== Global notices =====
// Crea y muestra notificaciones temporales en pantalla para feedback no bloqueante.
function ensureNoticeRoot() {
  if (document.querySelector("#app-notice-root")) return;
  const root = document.createElement("div");
  root.id = "app-notice-root";
  root.className = "app-notice-root";
  root.setAttribute("aria-live", "polite");
  root.setAttribute("aria-atomic", "false");
  document.body.appendChild(root);
}

function showNotice(text, type) {
  const root = document.querySelector("#app-notice-root");
  if (!root) return;

  const note = document.createElement("article");
  note.className = "app-notice app-notice-" + (type || "info");
  note.setAttribute("role", "status");
  note.innerHTML =
    '<p class="app-notice-text"></p><button type="button" class="app-notice-close" aria-label="Cerrar aviso">x</button>';
  note.querySelector(".app-notice-text").textContent = text;

  const closeButton = note.querySelector(".app-notice-close");
  if (closeButton) {
    closeButton.addEventListener("click", function () {
      note.remove();
    });
  }

  root.appendChild(note);
  setTimeout(function () {
    note.remove();
  }, 6500);
}
