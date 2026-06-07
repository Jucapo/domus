import { useEffect } from 'react'
import AppShell from './AppShell'
import { useAuthStore } from '../store/useAuthStore'
import { useAccountStore } from '../store/useAccountStore'
import { useFinanceCategoryStore } from '../store/useFinanceCategoryStore'
import { useFinanceTransactionStore } from '../store/useFinanceTransactionStore'
import { APPS } from '../apps/registry'

const FINANZAS_APP = APPS.find((a) => a.id === 'finanzas')!

export default function FinanzasLayout() {
  const householdId = useAuthStore((s) => s.user?.currentHouseholdId)
  const fetchAccounts = useAccountStore((s) => s.fetchAccounts)
  const fetchCategories = useFinanceCategoryStore((s) => s.fetchCategories)
  const fetchTransactions = useFinanceTransactionStore((s) => s.fetchTransactions)

  useEffect(() => {
    if (householdId) {
      fetchAccounts(householdId)
      fetchCategories(householdId)
      fetchTransactions(householdId)
    }
  }, [householdId, fetchAccounts, fetchCategories, fetchTransactions])

  return <AppShell app={FINANZAS_APP} />
}
