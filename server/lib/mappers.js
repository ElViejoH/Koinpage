export function mapUser(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email
  };
}

export function mapMember(row) {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    role: row.role,
    emoji: row.emoji,
    createdAt: row.created_at,
    updatedAt: row.updated_at || null
  };
}

export function mapTransaction(row) {
  return {
    id: row.id,
    userId: row.user_id,
    memberId: row.member_id,
    type: row.type,
    amount: Number(row.amount),
    category: row.category,
    date: row.date,
    description: row.description || "",
    createdAt: row.created_at,
    updatedAt: row.updated_at || null
  };
}

export function mapBudget(row) {
  return {
    id: row.id,
    userId: row.user_id,
    category: row.category,
    month: row.month,
    limit: Number(row.limit_amount),
    createdAt: row.created_at,
    updatedAt: row.updated_at || null
  };
}
