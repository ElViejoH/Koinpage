"use strict";

// ===== Page initializers =====
// Define la carga principal de cada vista (dashboard, miembros, presupuestos y transacciones).
function replaceArray(target, source) {
  if (!Array.isArray(target)) return;
  const next = Array.isArray(source) ? source : [];
  target.splice(0, target.length);
  next.forEach(function (item) {
    target.push(item);
  });
}

function upsertById(list, item) {
  const idx = list.findIndex(function (x) {
    return x.id === item.id;
  });
  if (idx >= 0) list[idx] = item;
  else list.push(item);
}

function initDashboard() {
  const state = {
    transactions: [],
    members: [],
    budgets: []
  };
  const dialog = document.querySelector("#transaction-dialog");
  const openButton = document.querySelector("[data-open-transaction]");
  const closeButton = document.querySelector("[data-close-transaction]");
  const form = document.querySelector("#transaction-form");
  const message = document.querySelector("#tx-message");
  const dateInput = document.querySelector("#tx-date");
  const memberSelect = document.querySelector("#tx-member");
  const typeSelect = document.querySelector("#tx-type");
  const categorySelect = document.querySelector("#tx-category");
  const categoryCustomInput = document.querySelector("#tx-category-custom");
  const dismissBudgetWarningButton = document.querySelector("[data-dismiss-budget-warning]");

  if (dateInput) {
    dateInput.value = todayIso();
  }
  syncMemberSelectOptions(memberSelect, state.members, true);
  const refreshDashboardCategories = bindCategoryControls(
    typeSelect,
    categorySelect,
    categoryCustomInput,
    state.budgets
  );
  bindBudgetWarningDismiss(dismissBudgetWarningButton);

  if (openButton && dialog) {
    openButton.addEventListener("click", function () {
      clearMessage(message);
      if (state.members.length === 0) {
        showNotice("Debes crear al menos un miembro antes de registrar transacciones.", "warning");
        return;
      }
      if (dialog.showModal) dialog.showModal();
    });
  }

  if (closeButton && dialog) {
    closeButton.addEventListener("click", function () {
      dialog.close();
    });
  }

  if (form) {
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      clearMessage(message);

      const formData = new FormData(form);
      const memberId = String(formData.get("memberId") || "").trim();
      const type = String(formData.get("type") || "");
      const amount = Number(formData.get("amount") || 0);
      const category = resolveTransactionCategory(
        String(formData.get("category") || "").trim(),
        String(formData.get("categoryCustom") || "").trim()
      );
      const date = String(formData.get("date") || "");
      const description = String(formData.get("description") || "").trim();

      if (state.members.length === 0) {
        showMessage(message, "Primero agrega al menos un miembro de la familia.", true);
        return;
      }

      if (!memberId || !type || amount <= 0 || !category || !date) {
        showMessage(message, "Completa todos los campos obligatorios.", true);
        return;
      }

      const balance = computeBalance(state.transactions);
      if (type === "expense" && amount > balance) {
        showMessage(
          message,
          "Saldo insuficiente. Registra mas ingresos antes de agregar este gasto.",
          true
        );
        return;
      }

      api.transactions
        .create({
          memberId: memberId,
          type: type,
          amount: amount,
          category: category,
          date: date,
          description: description
        })
        .then(function (resp) {
          const tx = resp && resp.transaction ? resp.transaction : null;
          if (tx) upsertById(state.transactions, tx);
          const overBudget = getBudgetOverrunForTransaction(state.budgets, state.transactions, {
            type: type,
            amount: amount,
            category: category,
            date: date
          });
          form.reset();
          if (dateInput) dateInput.value = todayIso();
          syncMemberSelectOptions(memberSelect, state.members, true);
          refreshDashboardCategories(false);
          if (dialog) dialog.close();
          renderDashboard(state);
          if (overBudget) showNotice(overBudget, "warning");
          else showNotice("Transaccion creada correctamente.", "info");
        })
        .catch(function (err) {
          showMessage(message, err && err.message ? err.message : "No se pudo guardar la transacción.", true);
        });
    });
  }

  Promise.all([api.transactions.list(), api.members.list(), api.budgets.list()])
    .then(function (results) {
      const txResp = results[0] || {};
      const membersResp = results[1] || {};
      const budgetsResp = results[2] || {};
      replaceArray(state.transactions, txResp.transactions);
      replaceArray(state.members, membersResp.members);
      replaceArray(state.budgets, budgetsResp.budgets);
      syncMemberSelectOptions(memberSelect, state.members, true);
      refreshDashboardCategories(false);
      renderDashboard(state);
    })
    .catch(function (err) {
      showNotice(err && err.message ? err.message : "No se pudo cargar la información.", "warning");
      renderDashboard(state);
    });

  renderDashboard(state);
}

function initMembersPage() {
  const state = {
    members: []
  };
  const listContainer = document.querySelector("#members-list");
  const dialog = document.querySelector("#member-dialog");
  const openButton = document.querySelector("[data-open-member]");
  const closeButton = document.querySelector("[data-close-member]");
  const form = document.querySelector("#member-form");
  const message = document.querySelector("#member-message");
  const formTitle = document.querySelector("#member-form-title");
  const formSubmit = document.querySelector("#member-submit");
  const memberIdInput = document.querySelector("#member-id");
  const emojiInput = document.querySelector("#member-emoji-value");
  const emojiPreview = document.querySelector("#member-emoji-preview");
  const emojiOptions = Array.from(document.querySelectorAll(".emoji-option"));

  if (openButton && dialog) {
    openButton.addEventListener("click", function () {
      clearMessage(message);
      resetMemberForm(
        form,
        memberIdInput,
        formTitle,
        formSubmit,
        emojiOptions,
        emojiInput,
        emojiPreview
      );
      if (dialog.showModal) dialog.showModal();
    });
  }

  if (closeButton && dialog) {
    closeButton.addEventListener("click", function () {
      dialog.close();
    });
  }

  emojiOptions.forEach(function (button) {
    button.addEventListener("click", function () {
      const emoji = String(button.dataset.emoji || "🧑");
      setSelectedEmoji(emojiOptions, button, emojiInput, emojiPreview, emoji);
    });
  });

  if (listContainer) {
    listContainer.addEventListener("click", function (event) {
      const optionsBtn = event.target.closest("[data-member-options]");
      if (optionsBtn) {
        const card = optionsBtn.closest(".member-item");
        if (!card) return;
        const isOpen = card.classList.contains("is-menu-open");
        closeAllMemberMenus(listContainer);
        if (!isOpen) card.classList.add("is-menu-open");
        return;
      }

      const editBtn = event.target.closest("[data-edit-member]");
      if (editBtn) {
        const id = String(editBtn.getAttribute("data-edit-member") || "");
        const member = state.members.find(function (item) {
          return item.id === id;
        });
        if (!member) return;
        closeAllMemberMenus(listContainer);
        fillMemberFormForEdit(
          form,
          memberIdInput,
          formTitle,
          formSubmit,
          emojiOptions,
          emojiInput,
          emojiPreview,
          member
        );
        clearMessage(message);
        if (dialog && dialog.showModal) dialog.showModal();
        return;
      }

      const deleteBtn = event.target.closest("[data-delete-member]");
      if (deleteBtn) {
        const id = String(deleteBtn.getAttribute("data-delete-member") || "");
        api.members
          .remove(id)
          .then(function () {
            replaceArray(
              state.members,
              state.members.filter(function (item) {
                return item.id !== id;
              })
            );
            renderMembersList(state.members);
            showNotice("Miembro eliminado correctamente.", "info");
          })
          .catch(function (err) {
            showNotice(err && err.message ? err.message : "No se pudo eliminar el miembro.", "warning");
          });
      }
    });

    document.addEventListener("click", function (event) {
      if (!listContainer.contains(event.target)) {
        closeAllMemberMenus(listContainer);
      }
    });
  }

  if (form) {
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      clearMessage(message);

      const formData = new FormData(form);
      const memberId = String(formData.get("id") || "").trim();
      const emoji = String(formData.get("emoji") || "").trim();
      const name = String(formData.get("name") || "").trim();
      const role = String(formData.get("role") || "").trim();

      if (!emoji || !name || !role) {
        showMessage(message, "Completa todos los campos para agregar el miembro.", true);
        return;
      }

      const payload = {
        emoji: emoji,
        name: name,
        role: role
      };
      const isEdit = Boolean(memberId);
      const op = isEdit ? api.members.update(memberId, payload) : api.members.create(payload);

      op
        .then(function (resp) {
          const member = resp && resp.member ? resp.member : null;
          if (member) upsertById(state.members, member);
          renderMembersList(state.members);
          resetMemberForm(
            form,
            memberIdInput,
            formTitle,
            formSubmit,
            emojiOptions,
            emojiInput,
            emojiPreview
          );
          showNotice(isEdit ? "Miembro actualizado correctamente." : "Miembro agregado correctamente.", "info");
          if (dialog) dialog.close();
        })
        .catch(function (err) {
          showMessage(message, err && err.message ? err.message : "No se pudo guardar el miembro.", true);
        });
    });
  }

  api.members
    .list()
    .then(function (resp) {
      replaceArray(state.members, resp.members);
      renderMembersList(state.members);
    })
    .catch(function (err) {
      showNotice(err && err.message ? err.message : "No se pudieron cargar los miembros.", "warning");
      renderMembersList(state.members);
    });
}
function initBudgetsPage() {
  const state = {
    budgets: [],
    transactions: []
  };
  const dialog = document.querySelector("#budget-dialog");
  const openButton = document.querySelector("[data-open-budget]");
  const closeButton = document.querySelector("[data-close-budget]");
  const form = document.querySelector("#budget-form");
  const message = document.querySelector("#budget-message");
  const monthInput = document.querySelector("#budget-month");

  if (monthInput) monthInput.value = currentMonthIso();

  if (openButton && dialog) {
    openButton.addEventListener("click", function () {
      clearMessage(message);
      if (dialog.showModal) dialog.showModal();
    });
  }

  if (closeButton && dialog) {
    closeButton.addEventListener("click", function () {
      dialog.close();
    });
  }

  if (form) {
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      clearMessage(message);

      const formData = new FormData(form);
      const id = String(formData.get("id") || "").trim();
      const category = String(formData.get("category") || "").trim();
      const month = String(formData.get("month") || "").trim();
      const limit = Number(formData.get("limit") || 0);

      if (!category || !month || limit <= 0) {
        showMessage(message, "Completa todos los campos del presupuesto.", true);
        return;
      }

      const op = id
        ? api.budgets.update(id, { category: category, month: month, limit: limit })
        : api.budgets.create({ category: category, month: month, limit: limit });

      op
        .then(function (resp) {
          const budget = resp && resp.budget ? resp.budget : null;
          if (budget) upsertById(state.budgets, budget);

          form.reset();
          if (monthInput) monthInput.value = currentMonthIso();
          if (dialog) dialog.close();
          // Reset form state
          document.querySelector("#budget-form-title").textContent = "Nuevo Presupuesto";
          document.querySelector("#budget-submit").textContent = "Guardar Presupuesto";
          const idInput = document.querySelector("#budget-id");
          if (idInput) idInput.remove();
          renderBudgetsPage(state);
          showNotice(id ? "Presupuesto actualizado correctamente." : "Presupuesto guardado correctamente.", "info");
        })
        .catch(function (err) {
          showMessage(message, err && err.message ? err.message : "No se pudo guardar el presupuesto.", true);
        });
    });
  }

  const currentContainer = document.querySelector("#budget-current-content");
  const allContainer = document.querySelector("#budget-all-content");

  [currentContainer, allContainer].forEach(function (container) {
    if (!container) return;
    container.addEventListener("click", function (event) {
      const optionsBtn = event.target.closest("[data-budget-options]");
      if (optionsBtn) {
        const item = optionsBtn.closest(".budget-item");
        if (!item) return;
        const isOpen = item.classList.contains("is-menu-open");
        closeAllBudgetMenus(currentContainer);
        closeAllBudgetMenus(allContainer);
        if (!isOpen) item.classList.add("is-menu-open");
        return;
      }

      const editBtn = event.target.closest("[data-edit-budget]");
      if (editBtn) {
        const id = String(editBtn.getAttribute("data-edit-budget") || "");
        const budget = state.budgets.find(function (item) {
          return item.id === id;
        });
        if (!budget) return;
        closeAllBudgetMenus(currentContainer);
        closeAllBudgetMenus(allContainer);
        // Fill form for edit
        const categoryInput = document.querySelector("#budget-category");
        const monthInput = document.querySelector("#budget-month");
        const limitInput = document.querySelector("#budget-limit");
        if (categoryInput) categoryInput.value = budget.category;
        if (monthInput) monthInput.value = budget.month;
        if (limitInput) limitInput.value = budget.limit;
        document.querySelector("#budget-form-title").textContent = "Editar Presupuesto";
        document.querySelector("#budget-submit").textContent = "Actualizar Presupuesto";
        // Add hidden id
        let idInput = document.querySelector("#budget-id");
        if (!idInput) {
          idInput = document.createElement("input");
          idInput.type = "hidden";
          idInput.id = "budget-id";
          idInput.name = "id";
          document.querySelector("#budget-form").appendChild(idInput);
        }
        idInput.value = budget.id;
        clearMessage(message);
        if (dialog.showModal) dialog.showModal();
        return;
      }

      const deleteBtn = event.target.closest("[data-delete-budget]");
      if (deleteBtn) {
        const id = String(deleteBtn.getAttribute("data-delete-budget") || "");
        api.budgets
          .remove(id)
          .then(function () {
            replaceArray(
              state.budgets,
              state.budgets.filter(function (item) {
                return item.id !== id;
              })
            );
            closeAllBudgetMenus(currentContainer);
            closeAllBudgetMenus(allContainer);
            renderBudgetsPage(state);
            showNotice("Presupuesto eliminado correctamente.", "info");
          })
          .catch(function (err) {
            showNotice(err && err.message ? err.message : "No se pudo eliminar el presupuesto.", "warning");
          });
      }
    });
  });

  document.addEventListener("click", function (event) {
    if (!currentContainer.contains(event.target) && !allContainer.contains(event.target)) {
      closeAllBudgetMenus(currentContainer);
      closeAllBudgetMenus(allContainer);
    }
  });

  Promise.all([api.budgets.list(), api.transactions.list()])
    .then(function (results) {
      const budgetsResp = results[0] || {};
      const txResp = results[1] || {};
      replaceArray(state.budgets, budgetsResp.budgets);
      replaceArray(state.transactions, txResp.transactions);
      renderBudgetsPage(state);
    })
    .catch(function (err) {
      showNotice(err && err.message ? err.message : "No se pudo cargar la información.", "warning");
      renderBudgetsPage(state);
    });
}

function initTransactionsPage() {
  const state = {
    members: [],
    transactions: [],
    budgets: []
  };
  const filterMember = document.querySelector("#filter-member");
  const filterType = document.querySelector("#filter-type");
  const dialog = document.querySelector("#transaction-page-dialog");
  const openButton = document.querySelector("[data-open-transaction-page]");
  const closeButton = document.querySelector("[data-close-transaction-page]");
  const form = document.querySelector("#transaction-page-form");
  const message = document.querySelector("#tx-page-message");
  const formMember = document.querySelector("#tx-page-member");
  const formType = document.querySelector("#tx-page-type");
  const formCategory = document.querySelector("#tx-page-category");
  const formCategoryCustom = document.querySelector("#tx-page-category-custom");
  const formDate = document.querySelector("#tx-page-date");
  const formId = document.querySelector("#tx-page-id");
  const formTitle = document.querySelector("#tx-page-form-title");
  const formSubmit = document.querySelector("#tx-page-submit");
  const tableContainer = document.querySelector("#transactions-table-container");

  syncFilterMemberOptions(filterMember, state.members);
  syncMemberSelectOptions(formMember, state.members, true);
  const refreshTransactionCategories = bindCategoryControls(
    formType,
    formCategory,
    formCategoryCustom,
    state.budgets
  );
  if (formDate) formDate.value = todayIso();

  if (openButton && dialog) {
    openButton.addEventListener("click", function () {
      clearMessage(message);
      if (state.members.length === 0) {
        showNotice("Debes crear al menos un miembro antes de registrar transacciones.", "warning");
        return;
      }
      resetTransactionFormToCreate(form, formId, formTitle, formSubmit, formDate);
      if (dialog.showModal) dialog.showModal();
    });
  }

  if (closeButton && dialog) {
    closeButton.addEventListener("click", function () {
      dialog.close();
    });
  }

  if (filterMember) {
    filterMember.addEventListener("change", function () {
      renderTransactionsPage(state, filterMember.value, filterType ? filterType.value : "all");
    });
  }

  if (filterType) {
    filterType.addEventListener("change", function () {
      renderTransactionsPage(state, filterMember ? filterMember.value : "all", filterType.value);
    });
  }

  if (form) {
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      clearMessage(message);

      const formData = new FormData(form);
      const transactionId = String(formData.get("id") || "").trim();
      const memberId = String(formData.get("memberId") || "").trim();
      const type = String(formData.get("type") || "").trim();
      const amount = Number(formData.get("amount") || 0);
      const category = resolveTransactionCategory(
        String(formData.get("category") || "").trim(),
        String(formData.get("categoryCustom") || "").trim()
      );
      const date = String(formData.get("date") || "").trim();
      const description = String(formData.get("description") || "").trim();

      if (!memberId || !type || amount <= 0 || !category || !date) {
        showMessage(message, "Completa todos los campos obligatorios.", true);
        return;
      }

      const projected = projectTransactionsAfterUpsert(state.transactions, {
        id: transactionId,
        memberId: memberId,
        type: type,
        amount: amount,
        category: category,
        date: date,
        description: description
      });
      if (computeBalance(projected) < 0) {
        showMessage(
          message,
          "Saldo insuficiente. Registra mas ingresos antes de agregar este gasto.",
          true
        );
        return;
      }

      const op = transactionId
        ? api.transactions.update(transactionId, {
          memberId: memberId,
          type: type,
          amount: amount,
          category: category,
          date: date,
          description: description
        })
        : api.transactions.create({
          memberId: memberId,
          type: type,
          amount: amount,
          category: category,
          date: date,
          description: description
        });

      op
        .then(function (resp) {
          const tx = resp && resp.transaction ? resp.transaction : null;
          if (tx) upsertById(state.transactions, tx);

          const overBudget = getBudgetOverrunForTransaction(state.budgets, state.transactions, {
            type: type,
            amount: amount,
            category: category,
            date: date
          });

          resetTransactionFormToCreate(form, formId, formTitle, formSubmit, formDate);
          syncMemberSelectOptions(formMember, state.members, true);
          refreshTransactionCategories(false);
          if (dialog) dialog.close();

          renderTransactionsPage(
            state,
            filterMember ? filterMember.value : "all",
            filterType ? filterType.value : "all"
          );
          if (overBudget) {
            showNotice(overBudget, "warning");
          } else {
            showNotice(transactionId ? "Transaccion actualizada correctamente." : "Transaccion creada correctamente.", "info");
          }
        })
        .catch(function (err) {
          showMessage(message, err && err.message ? err.message : "No se pudo guardar la transacción.", true);
        });
    });
  }

  if (tableContainer) {
    tableContainer.addEventListener("click", function (event) {
      const optionsBtn = event.target.closest("[data-transaction-options]");
      if (optionsBtn) {
        const row = optionsBtn.closest(".transaction-item");
        if (!row) return;
        const isOpen = row.classList.contains("is-menu-open");
        closeAllTransactionMenus(tableContainer);
        if (!isOpen) row.classList.add("is-menu-open");
        return;
      }

      const editButton = event.target.closest("[data-edit-transaction]");
      if (editButton) {
        const id = String(editButton.getAttribute("data-edit-transaction") || "");
        const tx = state.transactions.find(function (item) {
          return item.id === id;
        });
        if (!tx) return;
        closeAllTransactionMenus(tableContainer);
        clearMessage(message);
        fillTransactionFormForEdit(form, formId, formTitle, formSubmit, tx);
        syncMemberSelectOptions(formMember, state.members, true);
        refreshTransactionCategories(false);
        setSelectValue(formMember, tx.memberId);
        setCategoryValueWithCustom(formCategory, formCategoryCustom, tx.category);
        if (dialog.showModal) dialog.showModal();
        return;
      }

      const deleteButton = event.target.closest("[data-delete-transaction]");
      if (deleteButton) {
        const id = String(deleteButton.getAttribute("data-delete-transaction") || "");
        api.transactions
          .remove(id)
          .then(function () {
            replaceArray(
              state.transactions,
              state.transactions.filter(function (item) {
                return item.id !== id;
              })
            );
            closeAllTransactionMenus(tableContainer);
            renderTransactionsPage(
              state,
              filterMember ? filterMember.value : "all",
              filterType ? filterType.value : "all"
            );
            showNotice("Transacción eliminada correctamente.", "info");
          })
          .catch(function (err) {
            showNotice(err && err.message ? err.message : "No se pudo eliminar la transacción.", "warning");
          });
      }
    });

    document.addEventListener("click", function (event) {
      if (!tableContainer.contains(event.target)) {
        closeAllTransactionMenus(tableContainer);
      }
    });
  }

  Promise.all([api.members.list(), api.transactions.list(), api.budgets.list()])
    .then(function (results) {
      const membersResp = results[0] || {};
      const txResp = results[1] || {};
      const budgetsResp = results[2] || {};
      replaceArray(state.members, membersResp.members);
      replaceArray(state.transactions, txResp.transactions);
      replaceArray(state.budgets, budgetsResp.budgets);
      syncFilterMemberOptions(filterMember, state.members);
      syncMemberSelectOptions(formMember, state.members, true);
      refreshTransactionCategories(false);
      renderTransactionsPage(state, filterMember ? filterMember.value : "all", filterType ? filterType.value : "all");
    })
    .catch(function (err) {
      showNotice(err && err.message ? err.message : "No se pudo cargar la información.", "warning");
      renderTransactionsPage(state, filterMember ? filterMember.value : "all", filterType ? filterType.value : "all");
    });
}
