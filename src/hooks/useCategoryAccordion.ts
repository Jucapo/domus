import { useState, useEffect, useMemo, useCallback } from 'react'
import type { UUID } from '../types'

export type CategoryAccordionScope =
  | 'inventory'
  | 'gestion-productos'
  | 'precios-pending'
  | 'precios-history'
  | 'por-comprar'
  | (string & {})

export interface UseCategoryAccordionResult {
  toggleCategory: (category: string) => void
  isCategoryCollapsed: (category: string) => boolean
}

/**
 * Acordeón por categoría con persistencia en localStorage (misma semántica que Inventario).
 */
export function useCategoryAccordion(
  householdId: UUID | null | undefined,
  scope: CategoryAccordionScope,
): UseCategoryAccordionResult {
  const storageKey = useMemo(() => {
    if (scope === 'inventory') {
      return `inventoryCollapsedCategories:${householdId || 'unknown'}`
    }
    return `categoryAccordion:${scope}:${householdId || 'unknown'}`
  }, [householdId, scope])

  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(() => {
    try {
      const raw = localStorage.getItem(storageKey)
      const parsed = raw ? JSON.parse(raw) : []
      return new Set(Array.isArray(parsed) ? parsed : [])
    } catch {
      return new Set()
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(Array.from(collapsedCategories)))
    } catch {
      // ignore
    }
  }, [collapsedCategories, storageKey])

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey)
      const parsed = raw ? JSON.parse(raw) : []
      setCollapsedCategories(new Set(Array.isArray(parsed) ? parsed : []))
    } catch {
      setCollapsedCategories(new Set())
    }
  }, [storageKey])

  const toggleCategory = useCallback((category: string) => {
    setCollapsedCategories((prev) => {
      const next = new Set(prev)
      if (next.has(category)) next.delete(category)
      else next.add(category)
      return next
    })
  }, [])

  const isCategoryCollapsed = useCallback(
    (category: string) => collapsedCategories.has(category),
    [collapsedCategories],
  )

  return { toggleCategory, isCategoryCollapsed }
}
