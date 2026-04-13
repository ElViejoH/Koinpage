"use strict";

// ===== Page initializers =====
// Define la carga principal de cada vista (dashboard, miembros, presupuestos y transacciones).
function initDashboard() {
  const state = {
    transactions: loadList(STORAGE_TRANSACTIONS),
    members: loadList(STORAGE_MEMBERS),
    budgets: loadList(STORAGE_BUDGETS)
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

      state.transactions.push(
        buildTransaction({
          memberId: memberId,
          type: type,
          amount: amount,
          category: category,
          date: date,
          description: description
        })
      );

      saveList(STORAGE_TRANSACTIONS, state.transactions);
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
      if (overBudget) {
        showNotice(overBudget, "warning");
      }
    });
  }

  renderDashboard(state);
}

function initMembersPage() {
  const state = {
    members: loadList(STORAGE_MEMBERS)
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
        const nextMembers = state.members.filter(function (item) {
          return item.id !== id;
        });
        if (nextMembers.length === state.members.length) return;
        state.members = nextMembers;
        saveList(STORAGE_MEMBERS, state.members);
        renderMembersList(state.members);
        showNotice("Miembro eliminado correctamente.", "info");
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
        id: memberId || ("m-" + String(Date.now())),
        emoji: emoji,
        name: name,
        role: role
      };
      const existingIndex = state.members.findIndex(function (item) {
        return item.id === memberId;
      });
      if (existingIndex >= 0) {
        state.members[existingIndex] = payload;
      } else {
        state.members.push(payload);
      }

      saveList(STORAGE_MEMBERS, state.members);
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
      showNotice(
        existingIndex >= 0 ? "Miembro actualizado correctamente." : "Miembro agregado correctamente.",
        "info"
      );
      if (dialog) dialog.close();
    });
  }

  renderMembersList(state.members);
}
function initBudgetsPage() {
  const state = {
    budgets: loadList(STORAGE_BUDGETS),
    transactions: loadList(STORAGE_TRANSACTIONS)
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

      if (id) {
        // Edit existing
        const existingIndex = state.budgets.findIndex(function (item) {
          return item.id === id;
        });
        if (existingIndex >= 0) {
          state.budgets[existingIndex] = {
            id: id,
            category: category,
            month: month,
            limit: limit
          };
        }
      } else {
        // Add new or update if same category/month
        const existing = state.budgets.find(function (item) {
          return item.category.toLowerCase() === category.toLowerCase() && item.month === month;
        });

        if (existing) {
          existing.limit = limit;
        } else {
          state.budgets.push({
            id: "b-" + String(Date.now()) + "-" + Math.floor(Math.random() * 1000),
            category: category,
            month: month,
            limit: limit
          });
        }
      }

      saveList(STORAGE_BUDGETS, state.budgets);
      form.reset();
      if (monthInput) monthInput.value = currentMonthIso();
      if (dialog) dialog.close();
      // Reset form state
      document.querySelector("#budget-form-title").textContent = "Nuevo Presupuesto";
      document.querySelector("#budget-submit").textContent = "Guardar Presupuesto";
      const idInput = document.querySelector("#budget-id");
      if (idInput) idInput.remove();
      renderBudgetsPage(state);
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
        setSelectValue(document.querySelector("#budget-category"), budget.category);
        setSelectValue(document.querySelector("#budget-month"), budget.month);
        document.querySelector("#budget-limit").value = budget.limit;
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
        const nextBudgets = state.budgets.filter(function (item) {
          return item.id !== id;
        });
        if (nextBudgets.length === state.budgets.length) return;
        state.budgets = nextBudgets;
        saveList(STORAGE_BUDGETS, state.budgets);
        closeAllBudgetMenus(currentContainer);
        closeAllBudgetMenus(allContainer);
        renderBudgetsPage(state);
        showNotice("Presupuesto eliminado correctamente.", "info");
      }
    });
  });

  document.addEventListener("click", function (event) {
    if (!currentContainer.contains(event.target) && !allContainer.contains(event.target)) {
      closeAllBudgetMenus(currentContainer);
      closeAllBudgetMenus(allContainer);
    }
  });

  renderBudgetsPage(state);
}

function initTransactionsPage() {
  const state = {
    members: loadList(STORAGE_MEMBERS),
    transactions: loadList(STORAGE_TRANSACTIONS),
    budgets: loadList(STORAGE_BUDGETS)
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

      upsertTransaction(state.transactions, {
        id: transactionId,
        memberId: memberId,
        type: type,
        amount: amount,
        category: category,
        date: date,
        description: description
      });
      saveList(STORAGE_TRANSACTIONS, state.transactions);
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
        showNotice(
          transactionId ? "Transaccion actualizada correctamente." : "Transaccion creada correctamente.",
          "info"
        );
      }
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
        const nextTransactions = state.transactions.filter(function (item) {
          return item.id !== id;
        });
        if (nextTransactions.length === state.transactions.length) return;
        state.transactions = nextTransactions;
        saveList(STORAGE_TRANSACTIONS, state.transactions);
        closeAllTransactionMenus(tableContainer);
        renderTransactionsPage(
          state,
          filterMember ? filterMember.value : "all",
          filterType ? filterType.value : "all"
        );
        showNotice("Transacción eliminada correctamente.", "info");
      }
    });

    document.addEventListener("click", function (event) {
      if (!tableContainer.contains(event.target)) {
        closeAllTransactionMenus(tableContainer);
      }
    });
  }

  renderTransactionsPage(state, filterMember ? filterMember.value : "all", filterType ? filterType.value : "all");
}
