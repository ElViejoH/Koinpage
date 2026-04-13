"use strict";

// ===== Transactions view logic =====
// Agrupa renderizado, filtros y utilidades de edición para la tabla de transacciones.
function renderTransactionsPage(state, memberFilter, typeFilter) {
  renderTransactionsMetrics(state.transactions);
  renderTransactionsTable(state.transactions, state.members, memberFilter, typeFilter);
}

function renderTransactionsMetrics(transactions) {
  const income = transactions
    .filter(function (item) {
      return item.type === "income";
    })
    .reduce(function (sum, item) {
      return sum + Number(item.amount || 0);
    }, 0);
  const expense = transactions
    .filter(function (item) {
      return item.type === "expense";
    })
    .reduce(function (sum, item) {
      return sum + Number(item.amount || 0);
    }, 0);
  const balance = income - expense;

  setText("#tx-metric-income", money(income));
  setText("#tx-metric-expense", money(expense));
  setText("#tx-metric-balance", money(balance));
}

function renderTransactionsTable(transactions, members, memberFilter, typeFilter) {
  const title = document.querySelector("#tx-count-title");
  const container = document.querySelector("#transactions-table-container");
  if (!container) return;

  const filtered = transactions
    .filter(function (item) {
      if (memberFilter && memberFilter !== "all") return item.memberId === memberFilter;
      return true;
    })
    .filter(function (item) {
      if (typeFilter && typeFilter !== "all") return item.type === typeFilter;
      return true;
    })
    .sort(function (a, b) {
      return b.date.localeCompare(a.date);
    });

  if (title) title.textContent = "Todas las Transacciones (" + String(filtered.length) + ")";

  if (filtered.length === 0) {
    container.innerHTML =
      '<div class="tx-list-empty"><p>No hay transacciones para mostrar</p>' +
      "<small>Primero agrega miembros y registra movimientos</small></div>";
    return;
  }

  const rows = filtered
    .map(function (item) {
      const typeLabel = item.type === "income" ? "Ingreso" : "Gasto";
      const typeClass = item.type === "income" ? "type-income" : "type-expense";
      const signedAmount = (item.type === "income" ? "+ " : "- ") + money(item.amount);
      const memberName = getMemberName(item.memberId, members);

      return (
        "<tr class='transaction-item'><td>" +
        escapeHtml(item.date) +
        "</td><td>" +
        escapeHtml(memberName) +
        "</td><td class='" +
        typeClass +
        "'>" +
        escapeHtml(typeLabel) +
        "</td><td>" +
        escapeHtml(item.category || "Otros") +
        "</td><td>" +
        escapeHtml(item.description || "-") +
        "</td><td class='" +
        typeClass +
        "'>" +
        signedAmount +
        "</td><td>" +
        '<button type="button" class="member-options-btn" data-transaction-options aria-label="Opciones de la transacción">' +
        "⋯" +
        "</button>" +
        '<div class="member-options-menu" role="menu" aria-label="Opciones">' +
        '<button type="button" role="menuitem" data-edit-transaction="' + escapeHtml(item.id) + '">Editar</button>' +
        '<button type="button" role="menuitem" data-delete-transaction="' + escapeHtml(item.id) + '">Eliminar</button>' +
        "</div>" +
        "</td></tr>"
      );
    })
    .join("");

  container.innerHTML =
    '<table class="simple-table"><thead><tr><th>Fecha</th><th>Miembro</th><th>Tipo</th><th>Categoria</th><th>Descripcion</th><th>Monto</th><th>Acciones</th></tr></thead><tbody>' +
    rows +
    "</tbody></table>";
}

function upsertTransaction(list, data) {
  const existingIndex = list.findIndex(function (item) {
    return item.id === data.id;
  });
  const normalized = buildTransaction(data);
  if (existingIndex >= 0) {
    list[existingIndex] = normalized;
    return;
  }
  list.push(normalized);
}

function projectTransactionsAfterUpsert(list, data) {
  const copy = list.slice();
  upsertTransaction(copy, data);
  return copy;
}

function resetTransactionFormToCreate(form, idInput, titleNode, submitNode, dateInput) {
  if (form) form.reset();
  if (idInput) idInput.value = "";
  if (titleNode) titleNode.textContent = "Nueva Transaccion";
  if (submitNode) submitNode.textContent = "Guardar";
  if (dateInput) dateInput.value = todayIso();
}

function fillTransactionFormForEdit(form, idInput, titleNode, submitNode, transaction) {
  if (!form || !transaction) return;
  if (idInput) idInput.value = transaction.id || "";
  form.querySelector('[name="memberId"]').value = transaction.memberId || "";
  form.querySelector('[name="type"]').value = transaction.type || "expense";
  form.querySelector('[name="amount"]').value = Number(transaction.amount || 0);
  form.querySelector('[name="category"]').value = transaction.category || "";
  form.querySelector('[name="date"]').value = transaction.date || todayIso();
  form.querySelector('[name="description"]').value = transaction.description || "";
  if (titleNode) titleNode.textContent = "Editar Transaccion";
  if (submitNode) submitNode.textContent = "Actualizar";
}

function setSelectValue(selectNode, value) {
  if (!selectNode) return;
  const exists = Array.from(selectNode.options).some(function (option) {
    return option.value === value;
  });
  if (exists) selectNode.value = value;
}
