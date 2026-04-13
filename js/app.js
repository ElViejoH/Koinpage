"use strict";

// ===== App bootstrap =====
// Configura eventos globales de accesibilidad y dispara las inicializaciones base de la app.
document.addEventListener("click", function (event) {
  const link = event.target.closest('a[href^="#"]');
  if (!link) return;

  const targetId = link.getAttribute("href");
  if (!targetId || targetId === "#") return;

  const section = document.querySelector(targetId);
  if (!section) return;

  section.setAttribute("tabindex", "-1");
  setTimeout(function () {
    section.focus();
  }, 50);
});

initSessionFlow();
initAuthForms();
initHeroScroll();
initAppMainMenu();
ensureNoticeRoot();
