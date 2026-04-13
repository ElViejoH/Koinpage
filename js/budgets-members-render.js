"use strict";

// ===== Budgets and members rendering =====
// Contiene la UI de presupuestos y miembros (cards, formularios y menús de acciones).
function renderBudgetsPage(state) {
  const currentMonth = currentMonthIso();
  const currentTitle = document.querySelector("#budget-current-title");
  if (currentTitle) {
    currentTitle.textContent = "Presupuesto de " + prettyMonth(currentMonth);
  }

  const currentContainer = document.querySelector("#budget-current-content");
  const allContainer = document.querySelector("#budget-all-content");
  if (!currentContainer || !allContainer) return;

  const currentBudgets = state.budgets.filter(function (item) {
    return item.month === currentMonth;
  });

  if (currentBudgets.length === 0) {
    currentContainer.innerHTML =
      '<div class="tx-list-empty"><p>No has establecido presupuestos para este mes</p>' +
      "<small>Crea tu primer presupuesto para comenzar a controlar tus gastos</small></div>";
  } else {
    currentContainer.innerHTML = renderBudgetCards(currentBudgets, state.transactions);
  }

  if (state.budgets.length === 0) {
    allContainer.innerHTML = '<p class="empty-state">No hay presupuestos registrados</p>';
  } else {
    const sorted = state.budgets.slice().sort(function (a, b) {
      if (a.month === b.month) return a.category.localeCompare(b.category);
      return b.month.localeCompare(a.month);
    });
    allContainer.innerHTML = renderBudgetCards(sorted, state.transactions);
  }
}

function renderBudgetCards(budgets, transactions) {
  const cards = budgets
    .map(function (budget) {
      const spent = getCategorySpent(transactions, budget.category, budget.month);
      const percentRaw = budget.limit > 0 ? (spent / budget.limit) * 100 : 0;
      const percentView = Math.min(percentRaw, 100);
      const progressClass = percentRaw > 100 ? "is-danger" : percentRaw >= 80 ? "is-warning" : "";
      const note = percentRaw > 100
        ? "Advertencia: presupuesto excedido"
        : percentRaw >= 80
          ? "Atencion: estas cerca del tope"
          : "Presupuesto en control";

      return (
        '<article class="budget-item"><div class="budget-item-head"><div>' +
        '<h3 class="budget-item-title">' + escapeHtml(budget.category) + "</h3>" +
        '<p class="budget-item-sub">' + escapeHtml(prettyMonth(budget.month)) + "</p></div>" +
        '<button type="button" class="member-options-btn" data-budget-options aria-label="Opciones del presupuesto">' +
        "⋯" +
        "</button>" +
        '<div class="member-options-menu" role="menu" aria-label="Opciones">' +
        '<button type="button" role="menuitem" data-edit-budget="' + escapeHtml(budget.id) + '">Editar</button>' +
        '<button type="button" role="menuitem" data-delete-budget="' + escapeHtml(budget.id) + '">Eliminar</button>' +
        "</div>" +
        "<strong>" + money(spent) + " / " + money(budget.limit) + "</strong></div>" +
        '<div class="budget-progress ' + progressClass + '"><span style="width:' + percentView.toFixed(2) + '%"></span></div>' +
        '<p class="budget-note">' + escapeHtml(note) + "</p></article>"
      );
    })
    .join("");

  return '<div class="budget-list">' + cards + "</div>";
}

function setSelectedEmoji(options, selectedButton, emojiInput, emojiPreview, emojiValue) {
  options.forEach(function (button) {
    const isSelected = button === selectedButton;
    button.classList.toggle("is-selected", isSelected);
    button.setAttribute("aria-checked", String(isSelected));
  });
  if (emojiInput) emojiInput.value = emojiValue;
  if (emojiPreview) emojiPreview.textContent = emojiValue;
}

function renderMembersList(members) {
  const container = document.querySelector("#members-list");
  if (!container) return;

  if (!members.length) {
    container.innerHTML =
      '<div class="members-empty">' +
      '<div><div class="emoji">👤</div><h3>No hay miembros en tu familia todavia</h3>' +
      "<p>Agrega miembros para comenzar a gestionar las finanzas familiares</p></div>" +
      "</div>";
    return;
  }

  const cards = members
    .slice()
    .reverse()
    .map(function (member) {
      return (
        '<article class="member-item">' +
        '<div class="member-head">' +
        '<div class="avatar">' + escapeHtml(member.emoji || "🧑") + "</div>" +
        '<button type="button" class="member-options-btn" data-member-options aria-label="Opciones del miembro">' +
        "⋯" +
        "</button>" +
        '<div class="member-options-menu" role="menu" aria-label="Opciones">' +
        '<button type="button" role="menuitem" data-edit-member="' + escapeHtml(member.id) + '">Editar</button>' +
        '<button type="button" role="menuitem" data-delete-member="' + escapeHtml(member.id) + '">Eliminar</button>' +
        "</div>" +
        "</div>" +
        '<h3 class="name">' + escapeHtml(member.name || "") + "</h3>" +
        '<p class="role">' + escapeHtml(member.role || "") + "</p>" +
        "</article>"
      );
    })
    .join("");

  container.innerHTML = '<div class="member-grid">' + cards + "</div>";
}

function closeAllMemberMenus(container) {
  if (!container) return;
  container.querySelectorAll(".member-item.is-menu-open").forEach(function (card) {
    card.classList.remove("is-menu-open");
  });
}

function closeAllTransactionMenus(container) {
  if (!container) return;
  container.querySelectorAll(".transaction-item.is-menu-open").forEach(function (row) {
    row.classList.remove("is-menu-open");
  });
}

function closeAllBudgetMenus(container) {
  if (!container) return;
  container.querySelectorAll(".budget-item.is-menu-open").forEach(function (item) {
    item.classList.remove("is-menu-open");
  });
}

function resetMemberForm(form, idInput, titleNode, submitNode, emojiOptions, emojiInput, emojiPreview) {
  if (form) form.reset();
  if (idInput) idInput.value = "";
  if (titleNode) titleNode.textContent = "Nuevo Miembro";
  if (submitNode) submitNode.textContent = "Agregar Miembro";
  setSelectedEmoji(
    emojiOptions,
    emojiOptions[0] || null,
    emojiInput,
    emojiPreview,
    "🧑"
  );
}

function fillMemberFormForEdit(
  form,
  idInput,
  titleNode,
  submitNode,
  emojiOptions,
  emojiInput,
  emojiPreview,
  member
) {
  if (!form || !member) return;
  form.querySelector('[name="name"]').value = member.name || "";
  form.querySelector('[name="role"]').value = member.role || "";
  if (idInput) idInput.value = member.id || "";
  if (titleNode) titleNode.textContent = "Editar Miembro";
  if (submitNode) submitNode.textContent = "Guardar Cambios";

  const matching = emojiOptions.find(function (btn) {
    return String(btn.dataset.emoji || "") === String(member.emoji || "");
  });
  if (matching) {
    setSelectedEmoji(emojiOptions, matching, emojiInput, emojiPreview, member.emoji);
  } else {
    emojiOptions.forEach(function (button) {
      button.classList.remove("is-selected");
      button.setAttribute("aria-checked", "false");
    });
    if (emojiInput) emojiInput.value = member.emoji || "🧑";
    if (emojiPreview) emojiPreview.textContent = member.emoji || "🧑";
  }
}
