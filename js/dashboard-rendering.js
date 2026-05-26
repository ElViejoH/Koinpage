"use strict";

// ===== Dashboard rendering =====
// Renderiza widgets del dashboard: métricas, categorías, semana, movimientos y advertencias.
function renderDashboard(state) {
  renderMetrics(state.transactions);
  renderCategoryExpenses(state.transactions);
  renderWeeklyStats(state.transactions);
  renderRecentMoves(state.transactions, state.members);
  renderMembersWarning(state.members);
  renderBudgetWarnings(state.budgets, state.transactions);
}

function renderMetrics(transactions) {
  const income = transactions
    .filter(function (item) {
      return item.type === "income";
    })
    .reduce(function (sum, item) {
      return sum + Number(item.amount);
    }, 0);

  const expense = transactions
    .filter(function (item) {
      return item.type === "expense";
    })
    .reduce(function (sum, item) {
      return sum + Number(item.amount);
    }, 0);

  const balance = income - expense;
  setText("#metric-income", money(income));
  setText("#metric-expense", money(expense));
  setText("#metric-balance", money(balance));
}

function renderCategoryExpenses(transactions) {
  const container = document.querySelector("#category-expense");
  if (!container) return;

  const expenseItems = transactions.filter(function (item) {
    return item.type === "expense";
  });

  if (!expenseItems.length) {
    container.innerHTML =
      '<div class="chart-empty" role="img" aria-label="Grafico de dona de ejemplo para gastos por categoria">' +
      '<div class="chart-empty-donut" aria-hidden="true"></div>' +
      '<p class="chart-empty-text">Aun no hay gastos para visualizar</p>' +
      "</div>";
    return;
  }

  const grouped = {};
  expenseItems.forEach(function (item) {
    const key = item.category || "Otros";
    grouped[key] = (grouped[key] || 0) + Number(item.amount);
  });

  const rows = Object.keys(grouped)
    .sort(function (a, b) {
      return grouped[b] - grouped[a];
    })
    .map(function (category) {
      return (
        "<tr><td>" +
        escapeHtml(category) +
        "</td><td class='numeric-col'>" +
        money(grouped[category]) +
        "</td></tr>"
      );
    })
    .join("");

  container.innerHTML =
    '<table class="simple-table"><thead><tr><th>Categoria</th><th class="numeric-col">Monto</th></tr></thead><tbody>' +
    rows +
    "</tbody></table>";
}

function renderWeeklyStats(transactions) {
  const container = document.querySelector("#weekly-stats");
  if (!container) return;

  const days = last7Days();
  const dayMap = {};
  days.forEach(function (item) {
    dayMap[item.date] = { label: item.label, income: 0, expense: 0 };
  });

  transactions.forEach(function (item) {
    if (!dayMap[item.date]) return;
    if (item.type === "income") dayMap[item.date].income += Number(item.amount);
    if (item.type === "expense") dayMap[item.date].expense += Number(item.amount);
  });

  const rows = days
    .map(function (day) {
      const data = dayMap[day.date];
      return (
        "<tr><td>" +
        data.label +
        "</td><td class='type-income numeric-col'>" +
        money(data.income) +
        "</td><td class='type-expense numeric-col'>" +
        money(data.expense) +
        "</td></tr>"
      );
    })
    .join("");

  container.innerHTML =
    '<table class="simple-table weekly-table"><thead><tr><th>Dia</th><th class="numeric-col">Ingresos</th><th class="numeric-col">Gastos</th></tr></thead><tbody>' +
    rows +
    "</tbody></table>";
}

function renderRecentMoves(transactions, members) {
  const container = document.querySelector("#recent-moves");
  if (!container) return;
  const membersList = Array.isArray(members) ? members : [];

  if (!transactions.length) {
    container.innerHTML = '<p class="empty-state">No hay movimientos registrados</p>';
    return;
  }

  const rows = transactions
    .slice()
    .sort(function (a, b) {
      return b.date.localeCompare(a.date);
    })
    .slice(0, 12)
    .map(function (item) {
      const typeClass = item.type === "income" ? "type-income" : "type-expense";
      const typeLabel = item.type === "income" ? "Ingreso" : "Gasto";
      const signedAmount = (item.type === "income" ? "+ " : "- ") + money(item.amount);
      return (
        "<tr><td>" +
        escapeHtml(item.date) +
        "</td><td>" +
        escapeHtml(getMemberName(item.memberId, membersList)) +
        "</td><td>" +
        escapeHtml(typeLabel) +
        "</td><td>" +
        escapeHtml(item.category || "Otros") +
        "</td><td>" +
        escapeHtml(item.description || "-") +
        "</td><td class='" +
        typeClass +
        "'>" +
        signedAmount +
        "</td></tr>"
      );
    })
    .join("");

  container.innerHTML =
    '<table class="simple-table"><thead><tr><th>Fecha</th><th>Miembro</th><th>Tipo</th><th>Categoria</th><th>Descripcion</th><th>Monto</th></tr></thead><tbody>' +
    rows +
    "</tbody></table>";
}

function renderMembersWarning(members) {
  const box = document.querySelector("#members-warning");
  if (!box) return;
  box.hidden = Array.isArray(members) && members.length > 0;
}

function syncMemberSelectOptions(selectNode, members, required) {
  if (!selectNode) return;

  if (!Array.isArray(members) || members.length === 0) {
    selectNode.innerHTML = '<option value="">No hay miembros</option>';
    selectNode.disabled = true;
    return;
  }

  const firstOption = required
    ? '<option value="">Seleccionar miembro</option>'
    : '<option value="all">Todos los miembros</option>';
  const options = members
    .map(function (member) {
      const label = (member.emoji || "🧑") + " " + (member.name || "Miembro");
      return '<option value="' + escapeHtml(member.id) + '">' + escapeHtml(label) + "</option>";
    })
    .join("");

  selectNode.disabled = false;
  selectNode.innerHTML = firstOption + options;
}

function syncFilterMemberOptions(selectNode, members) {
  if (!selectNode) return;

  const options = members
    .map(function (member) {
      const label = (member.emoji || "🧑") + " " + (member.name || "Miembro");
      return '<option value="' + escapeHtml(member.id) + '">' + escapeHtml(label) + "</option>";
    })
    .join("");
  selectNode.innerHTML = '<option value="all">Todos los miembros</option>' + options;
}

function getMemberName(memberId, members) {
  const found = members.find(function (member) {
    return member.id === memberId;
  });
  return found ? found.name : "Sin miembro";
}

function buildTransaction(data) {
  return {
    id: data.id || ("t-" + String(Date.now()) + "-" + Math.floor(Math.random() * 1000)),
    memberId: data.memberId,
    type: data.type,
    amount: Number(data.amount),
    category: data.category,
    date: data.date,
    description: data.description || ""
  };
}

function syncCategorySelectOptions(selectNode, type, budgets, required) {
  if (!selectNode) return;

  const expenseBaseCategories = [
    "Alimentacion",
    "Transporte",
    "Vivienda",
    "Salud",
    "Educacion",
    "Entretenimiento",
    "Servicios",
    "Deudas"
  ];
  const incomeBaseCategories = [
    "Salario",
    "Negocio",
    "Inversiones",
    "Regalos",
    "Reembolsos"
  ];
  const normalizedType = type === "income" ? "income" : "expense";
  const budgetCategories = normalizedType === "expense"
    ? (Array.isArray(budgets) ? budgets : [])
      .map(function (item) {
        return String(item.category || "").trim();
      })
      .filter(Boolean)
    : [];
  const base = normalizedType === "income" ? incomeBaseCategories : expenseBaseCategories;
  const unique = Array.from(new Set(base.concat(budgetCategories).concat(["Otro"])));

  const firstOption = required
    ? '<option value="">Seleccionar categoria</option>'
    : '<option value="all">Todas las categorias</option>';
  const options = unique
    .map(function (category) {
      const optionValue = category === "Otro" ? "other" : category;
      return '<option value="' + escapeHtml(optionValue) + '">' + escapeHtml(category) + "</option>";
    })
    .join("");
  selectNode.innerHTML = firstOption + options;
}

function toggleCustomCategoryInput(selectNode, customInput) {
  if (!customInput) return;
  const isOther = Boolean(selectNode) && selectNode.value === "other";
  const fieldContainer = customInput.closest(".tx-field");
  if (fieldContainer) {
    fieldContainer.hidden = !isOther;
  } else {
    customInput.hidden = !isOther;
  }
  customInput.required = isOther;
  if (!isOther) customInput.value = "";
}

function bindCategoryControls(typeSelect, categorySelect, customInput, budgets) {
  if (!typeSelect || !categorySelect) return function () {};

  function refreshCategories(keepCurrentCategory) {
    const previousValue = keepCurrentCategory ? String(categorySelect.value || "") : "";
    syncCategorySelectOptions(categorySelect, typeSelect.value, budgets, true);
    if (previousValue) {
      const exists = Array.from(categorySelect.options).some(function (option) {
        return option.value === previousValue;
      });
      if (exists) categorySelect.value = previousValue;
    }
    toggleCustomCategoryInput(categorySelect, customInput);
  }

  typeSelect.addEventListener("change", function () {
    refreshCategories(false);
  });
  categorySelect.addEventListener("change", function () {
    toggleCustomCategoryInput(categorySelect, customInput);
  });

  refreshCategories(false);
  return refreshCategories;
}

function resolveTransactionCategory(selectedCategory, customCategory) {
  if (selectedCategory === "other") {
    return String(customCategory || "").trim();
  }
  return String(selectedCategory || "").trim();
}

function setCategoryValueWithCustom(categorySelect, customInput, categoryValue) {
  if (!categorySelect) return;
  const normalizedValue = String(categoryValue || "").trim();
  if (!normalizedValue) {
    categorySelect.value = "";
    toggleCustomCategoryInput(categorySelect, customInput);
    return;
  }

  const exists = Array.from(categorySelect.options).some(function (option) {
    return option.value === normalizedValue;
  });

  if (exists && normalizedValue !== "other") {
    categorySelect.value = normalizedValue;
    if (customInput) customInput.value = "";
    toggleCustomCategoryInput(categorySelect, customInput);
    return;
  }

  categorySelect.value = "other";
  if (customInput) customInput.value = normalizedValue;
  toggleCustomCategoryInput(categorySelect, customInput);
}

function getBudgetOverrunForTransaction(budgets, transactions, transaction) {
  if (transaction.type !== "expense") return "";
  const month = String(transaction.date || "").slice(0, 7);
  const budget = budgets.find(function (item) {
    return (
      item.month === month &&
      String(item.category || "").toLowerCase() === String(transaction.category || "").toLowerCase()
    );
  });
  if (!budget) return "";

  const spent = getCategorySpent(transactions, budget.category, budget.month);
  if (spent <= Number(budget.limit || 0)) return "";

  return (
    "Advertencia: superaste el presupuesto de " +
    budget.category +
    " en " +
    prettyMonth(budget.month) +
    "."
  );
}

function getCategorySpent(transactions, category, month) {
  return transactions
    .filter(function (item) {
      return (
        item.type === "expense" &&
        String(item.category || "").toLowerCase() === String(category || "").toLowerCase() &&
        String(item.date || "").slice(0, 7) === month
      );
    })
    .reduce(function (sum, item) {
      return sum + Number(item.amount || 0);
    }, 0);
}

function renderBudgetWarnings(budgets, transactions) {
  const box = document.querySelector("#budget-warning");
  const textNode = document.querySelector("#budget-warning-text");
  if (!box) return;

  const currentMonth = currentMonthIso();
  const warnings = budgets
    .filter(function (budget) {
      return budget.month === currentMonth;
    })
    .map(function (budget) {
      const spent = getCategorySpent(transactions, budget.category, budget.month);
      const limit = Number(budget.limit || 0);
      return {
        category: budget.category,
        spent: spent,
        limit: limit
      };
    })
    .filter(function (item) {
      return item.limit > 0 && item.spent > item.limit;
    });

  if (warnings.length === 0) {
    box.hidden = true;
    box.dataset.warningKey = "";
    if (textNode) textNode.textContent = "";
    return;
  }

  const warningsDisabled = localStorage.getItem(STORAGE_BUDGET_WARNING_DISABLED) === "1";
  if (warningsDisabled) {
    box.hidden = true;
    return;
  }

  const warningText = warnings
    .map(function (item) {
      return (
        "Categoria " +
        item.category +
        " excedida: " +
        money(item.spent) +
        " de " +
        money(item.limit)
      );
    })
    .join(" | ");

  if (!warningText.trim()) {
    box.hidden = true;
    box.dataset.warningKey = "";
    if (textNode) textNode.textContent = "";
    return;
  }

  const dismissedKey = localStorage.getItem(STORAGE_BUDGET_WARNING_DISMISSED) || "";
  box.dataset.warningKey = warningText;
  if (dismissedKey === warningText) {
    box.hidden = true;
    return;
  }

  box.hidden = false;
  if (textNode) textNode.textContent = warningText;
}

function bindBudgetWarningDismiss(button) {
  if (!button) return;
  button.addEventListener("click", function () {
    const box = document.querySelector("#budget-warning");
    if (!box) return;
    const key = String(box.dataset.warningKey || "").trim();
    if (key) {
      localStorage.setItem(STORAGE_BUDGET_WARNING_DISMISSED, key);
    }
    localStorage.setItem(STORAGE_BUDGET_WARNING_DISABLED, "1");
    box.hidden = true;
  });
}
