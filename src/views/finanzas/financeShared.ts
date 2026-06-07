import type { Account, AccountType, FinanceTransaction } from '../../types'

/** Formatea un monto en la moneda dada (es-CO, sin decimales para COP). */
export function formatMoney(amount: number, currency: string = 'COP'): string {
  try {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency,
      minimumFractionDigits: currency === 'COP' ? 0 : 2,
    }).format(amount)
  } catch {
    // Moneda no reconocida por Intl: fallback simple.
    return `${currency} ${amount.toLocaleString('es-CO')}`
  }
}

export function formatLongDate(dateStr: string): string {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('es-CO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  cash: 'Efectivo',
  bank: 'Banco',
  credit_card: 'Tarjeta de crédito',
  savings: 'Ahorro',
  person: 'Persona / Préstamo',
  other: 'Otra',
}

/**
 * Saldo actual de una cuenta = saldo inicial + ingresos − gastos ± transferencias.
 * Las transferencias entre monedas distintas usan `amountSecondary` en el destino.
 */
export function accountBalance(
  account: Account,
  transactions: FinanceTransaction[],
): number {
  let balance = account.initialBalance
  for (const t of transactions) {
    if (t.type === 'income' && t.accountId === account.id) balance += t.amount
    else if (t.type === 'expense' && t.accountId === account.id) balance -= t.amount
    else if (t.type === 'transfer') {
      if (t.accountId === account.id) balance -= t.amount
      if (t.toAccountId === account.id) balance += t.amountSecondary ?? t.amount
    }
  }
  return balance
}

/** Agrupa transacciones por fecha (ya vienen ordenadas desc por el store). */
export function groupByDate(
  transactions: FinanceTransaction[],
): { date: string; items: FinanceTransaction[] }[] {
  const groups: { date: string; items: FinanceTransaction[] }[] = []
  const index = new Map<string, number>()
  for (const t of transactions) {
    let i = index.get(t.date)
    if (i === undefined) {
      i = groups.length
      index.set(t.date, i)
      groups.push({ date: t.date, items: [] })
    }
    groups[i].items.push(t)
  }
  return groups
}

/** Fecha de hoy en formato YYYY-MM-DD (hora local). */
export function todayISO(): string {
  const d = new Date()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}
