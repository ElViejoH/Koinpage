"use strict";

// ===== Global auth and shared UI behavior =====
// Maneja autenticación de formularios y comportamientos compartidos de navegación/feedback visual.
function isInComponentsFolder() {
  return window.location.pathname.includes("/Components/");
}

function getDashboardUrl() {
  return isInComponentsFolder() ? "dashboard.html" : "Components/dashboard.html";
}

function getHomeAuthUrl(type) {
  const authType = type === "register" ? "register" : "login";
  return isInComponentsFolder() ? "../index.html?auth=" + authType : "index.html?auth=" + authType;
}

function openAuthModal(type) {
  const overlay = document.querySelector(".auth-overlay");
  if (!overlay) {
    window.location.href = getHomeAuthUrl(type);
    return;
  }

  const loginPanel = overlay.querySelector(".auth-login");
  const registerPanel = overlay.querySelector(".auth-register");
  const panelType = type === "register" ? "register" : "login";

  if (loginPanel) loginPanel.classList.toggle("is-active", panelType === "login");
  if (registerPanel) registerPanel.classList.toggle("is-active", panelType === "register");

  overlay.classList.add("is-open");
  document.body.classList.add("modal-open");
  overlay.setAttribute("aria-hidden", "false");

  const titleId = panelType === "register" ? "register-title" : "login-title";
  overlay.setAttribute("aria-labelledby", titleId);

  const activeInput = overlay.querySelector(".auth-card.is-active input");
  if (activeInput) activeInput.focus();
}

function closeAuthModal() {
  const overlay = document.querySelector(".auth-overlay");
  if (!overlay) return;

  overlay.classList.remove("is-open");
  document.body.classList.remove("modal-open");
  overlay.setAttribute("aria-hidden", "true");
}

function initAuthModals() {
  const overlay = document.querySelector(".auth-overlay");
  if (!overlay) return;

  const openButtons = document.querySelectorAll("[data-open-auth]");
  const closeButtons = overlay.querySelectorAll("[data-close-auth], .auth-close");

  openButtons.forEach(function (button) {
    button.addEventListener("click", function (event) {
      event.preventDefault();
      const type = String(button.dataset.openAuth || "login");
      openAuthModal(type);
    });
  });

  closeButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      closeAuthModal();
    });
  });

  overlay.addEventListener("click", function (event) {
    if (event.target === overlay) {
      closeAuthModal();
    }
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && overlay.classList.contains("is-open")) {
      closeAuthModal();
    }
  });
}

function initAuthModalFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const auth = params.get("auth");
  if (auth !== "login" && auth !== "register") return;

  if (typeof getSession === "function" && getSession()) {
    window.location.href = getDashboardUrl();
    return;
  }

  openAuthModal(auth);
  history.replaceState({}, document.title, window.location.pathname);
}

function initAuthForms() {
  const forms = document.querySelectorAll("[data-auth-form]");
  if (!forms.length) return;

  forms.forEach(function (form) {
    const emailInput = form.querySelector('input[type="email"]');
    const message = form.querySelector(".form-message");

    if (emailInput) {
      emailInput.addEventListener("input", function () {
        validateEmailAt(emailInput);
      });
    }

    form.addEventListener("submit", function (event) {
      clearMessage(message);

      if (emailInput && !validateEmailAt(emailInput)) {
        event.preventDefault();
        emailInput.setAttribute("aria-invalid", "true");
        showMessage(message, "El correo debe incluir el simbolo @.", true);
        emailInput.focus();
        return;
      }

      if (!form.checkValidity()) {
        event.preventDefault();
        showMessage(message, "Revisa los campos obligatorios e intenta de nuevo.", true);
        return;
      }

      if (form.id === "login-form") {
        event.preventDefault();
        const email = String(form.querySelector('[name="email"]').value).trim().toLowerCase();
        const password = String(form.querySelector('[name="password"]').value);

        api.auth
          .login(email, password)
          .then(function () {
            window.location.href = getDashboardUrl();
          })
          .catch(function (err) {
            showMessage(message, err && err.message ? err.message : "No se pudo iniciar sesión.", true);
          });
        return;
      }

      if (form.id === "register-form") {
        event.preventDefault();
        const pass = form.querySelector('[name="password"]');
        const confirm = form.querySelector('[name="passwordConfirm"]');

        if (pass && confirm && pass.value !== confirm.value) {
          confirm.setCustomValidity("Las contrasenas no coinciden.");
          confirm.setAttribute("aria-invalid", "true");
          showMessage(message, "Las contrasenas no coinciden.", true);
          confirm.focus();
          return;
        }

        const name = String(form.querySelector('[name="name"]').value || "").trim();
        const email = String(form.querySelector('[name="email"]').value || "").trim().toLowerCase();
        const password = String(pass ? pass.value : "");

        api.auth
          .register(name, email, password)
          .then(function () {
            window.location.href = getDashboardUrl();
          })
          .catch(function (err) {
            showMessage(message, err && err.message ? err.message : "No se pudo registrar.", true);
          });
        return;
      }

      event.preventDefault();
      showMessage(message, "Formulario valido.", false);
    });
  });
}

function initHeroScroll() {
  const hero = document.querySelector(".hero");
  const heroNavMain = document.querySelector(".hero-nav-main");
  const heroCopy = document.querySelector(".hero-copy");
  if (!hero || !heroNavMain || !heroCopy) return;

  const heroHeight = hero.offsetHeight;
  const fadeDistance = Math.max(heroHeight * 0.45, 300);
  let animationFrameId = null;

  function updateHeroState() {
    const scrolled = window.scrollY;
    const progress = Math.min(1, Math.max(0, scrolled / fadeDistance));
    const bgPosition = Math.min(44, progress * 44);
    const navRevealStart = 0;
    const menuOpacity = scrolled <= navRevealStart
      ? 0
      : Math.max(0, 1 - progress * 1.2);
    const menuOffset = progress * 16;
    const copyOpacity = Math.max(0, 1 - progress * 1.25);
    const copyOffset = progress * 24;
    const mainMenuHidden = menuOpacity <= 0;
    const shouldCompact = scrolled > 0 && mainMenuHidden;

    hero.style.setProperty("--hero-bg-pos", `${bgPosition}%`);
    heroNavMain.style.opacity = `${menuOpacity}`;
    heroNavMain.style.visibility = menuOpacity <= 0.01 ? "hidden" : "visible";
    heroNavMain.style.pointerEvents = menuOpacity <= 0.01 ? "none" : "auto";
    heroNavMain.style.transform = `translateY(${menuOffset}px)`;
    heroCopy.style.opacity = `${copyOpacity}`;
    heroCopy.style.transform = `translateY(${copyOffset}px)`;
    heroCopy.style.pointerEvents = copyOpacity <= 0.08 ? "none" : "auto";
    hero.classList.toggle("hero--compact", shouldCompact);
  }

  window.addEventListener("scroll", function () {
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
    animationFrameId = requestAnimationFrame(updateHeroState);
  }, { passive: true });

  updateHeroState();
}

function initAppMainMenu() {
  const toggleButton = document.querySelector("[data-nav-toggle]");
  const menu = document.querySelector(".app-nav");
  if (!toggleButton || !menu) return;

  function setExpanded(expanded) {
    menu.classList.toggle("is-open", expanded);
    toggleButton.setAttribute("aria-expanded", String(expanded));
  }

  toggleButton.addEventListener("click", function () {
    const isExpanded = toggleButton.getAttribute("aria-expanded") === "true";
    setExpanded(!isExpanded);
  });

  menu.querySelectorAll("a").forEach(function (link) {
    link.addEventListener("click", function () {
      setExpanded(false);
    });
  });

  document.addEventListener("click", function (event) {
    if (!menu.classList.contains("is-open")) return;
    if (menu.contains(event.target) || toggleButton.contains(event.target)) return;
    setExpanded(false);
  });

  window.addEventListener("resize", function () {
    if (window.innerWidth > 900) {
      setExpanded(false);
    }
  });
}

function validateEmailAt(input) {
  const value = input.value.trim();
  const valid = value.includes("@");
  input.setCustomValidity(valid ? "" : "El correo debe incluir el simbolo @.");
  input.setAttribute("aria-invalid", String(!valid));
  return valid;
}

function showMessage(container, text, isError) {
  if (!container) return;
  container.textContent = text;
  container.classList.toggle("error", Boolean(isError));
  container.classList.toggle("success", !isError);
}

function clearMessage(container) {
  if (!container) return;
  container.textContent = "";
  container.classList.remove("error", "success");
}
