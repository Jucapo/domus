import { useState, useEffect, useMemo, useCallback } from 'react'

/**
 * Acordeón por categoría con persistencia en localStorage (misma semántica que Inventario).
 * @param {string|null} householdId
 * @param {string} scope — 'inventory' | 'gestion-productos' | 'precios-pending' | 'precios-history' | 'por-comprar'
 */
export function useCategoryAccordion(householdId, scope) {
  const storageKey = useMemo(() => {
    if (scope === 'inventory') {
      return `inventoryCollapsedCategories:${householdId || 'unknown'}`
    }
    return `categoryAccordion:${scope}:${householdId || 'unknown'}`
  }, [householdId, scope])

  const [collapsedCategories, setCollapsedCategories] = useState(() => {
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

  const toggleCategory = useCallback((category) => {
    setCollapsedCategories((prev) => {
      const next = new Set(prev)
      if (next.has(category)) next.delete(category)
      else next.add(category)
      return next
    })
  }, [])

  const isCategoryCollapsed = useCallback(
    (category) => collapsedCategories.has(category),
    [collapsedCategories],
  )

  return { toggleCategory, isCategoryCollapsed }
}
