"use strict";

// ===== Global auth and shared UI behavior =====
// Maneja autenticación de formularios y comportamientos compartidos de navegación/feedback visual.

function initializeInitialMember(userName) {
  const members = loadList(STORAGE_MEMBERS);
  
  // Solo crear miembro inicial si no existen miembros
  if (members.length === 0 && userName) {
    const initialMember = {
      id: "m-" + String(Date.now()),
      name: userName,
      role: "Propietario",
      emoji: "🧑"
    };
    members.push(initialMember);
    saveList(STORAGE_MEMBERS, members);
  }
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
        const email = String(form.querySelector('[name="email"]').value).trim().toLowerCase();
        const password = String(form.querySelector('[name="password"]').value);

        // Validar contra usuarios registrados o demo user
        const registeredUsers = loadList(STORAGE_REGISTERED_USERS);
        let validUser = null;

        if (email === DEMO_USER.email && password === DEMO_USER.password) {
          validUser = DEMO_USER;
        } else {
          validUser = registeredUsers.find(function (user) {
            return user.email === email && user.password === password;
          });
        }

        if (!validUser) {
          event.preventDefault();
          showMessage(
            message,
            "Credenciales invalidas. Verifica tu email y contrasena.",
            true
          );
          return;
        }

        event.preventDefault();
        localStorage.setItem(
          SESSION_KEY,
          JSON.stringify({ email: validUser.email, name: validUser.name })
        );
        
        // Crear miembro inicial si no existen miembros
        initializeInitialMember(validUser.name);
        
        window.location.href = "dashboard.html";
        return;
      }

      if (form.id === "register-form") {
        const pass = form.querySelector('[name="password"]');
        const confirm = form.querySelector('[name="passwordConfirm"]');

        if (pass && confirm && pass.value !== confirm.value) {
          event.preventDefault();
          confirm.setCustomValidity("Las contrasenas no coinciden.");
          confirm.setAttribute("aria-invalid", "true");
          showMessage(message, "Las contrasenas no coinciden.", true);
          confirm.focus();
          return;
        }

        // Guardar usuario registrado
        const formData = new FormData(form);
        const registeredUsers = loadList(STORAGE_REGISTERED_USERS);
        const newUser = {
          id: "u-" + String(Date.now()),
          email: String(formData.get("email") || "").trim().toLowerCase(),
          name: String(formData.get("name") || "").trim(),
          password: String(formData.get("password") || "")
        };

        registeredUsers.push(newUser);
        saveList(STORAGE_REGISTERED_USERS, registeredUsers);

        event.preventDefault();
        showMessage(message, "Cuenta creada exitosamente. Inicia sesion para continuar.", false);
        form.reset();
        // Redirigir a login después de 2 segundos
        setTimeout(function () {
          window.location.href = "login.html";
        }, 2000);
        return;
      }

      event.preventDefault();
      showMessage(message, "Formulario valido. Conexion lista para backend.", false);
      form.reset();
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
