# Plan de optimización — Mayo 2026

Registro detallado del plan de optimización iniciado el **2026-05-17** al retomar Domus tras una pausa de varios meses.

## Contexto

Domus se desarrolló inicialmente como un MVP funcional (commits previos a `8599a00`): inventario, lista de compras, registro de facturas (PDF + XML DIAN), historial de precios, gastos, gestión de categorías y productos.

Estado al retomar:
- **Funcional**: la app la usaba el dev y su familia en un solo hogar.
- **Sin TypeScript** (todo JS plano).
- **Sin tests** (parsers de facturas frágiles, propensos a regresiones).
- **Sin auth real**: `HOUSEHOLD_ID` hardcodeado, RLS `allow_all` (modo beta).
- **Deuda visual**: dos archivos gigantes (`RegistrarCompra.jsx` y `FacturasListSection.jsx`) con lógica duplicada.

Decisiones de planeación (acordadas con el dev al retomar):
- Prioridad: **calidad de código** primero, antes de features nuevos.
- Migración a TypeScript: **completa de una vez**, no gradual.
- Móvil intensivo: no urgente (responsive actual basta).
- Auth provider: **Supabase Auth** + Google OAuth (descartado Cognito por costos, descartado auth propio por trabajo de mantenimiento).
- Modo de trabajo: ejecutar hitos completos sin pausas intermedias; QA al final.

## Hitos

| # | Hito | Commit | Estado | Resumen |
|---|---|---|---|---|
| 0 | Fix bug `useInvoiceStore.deleteInvoice` | (en `41175f7`) | ✅ | `get()` no estaba destructurado en `create((set) => ...)` |
| 1 | Migración a TypeScript | `41175f7` | ✅ | ~40 archivos, strict moderado, 0 errores TS |
| 2 | Suite de tests para parsers de facturas | `acc4a06` | ✅ | 34 tests Vitest, refactor `invoicePdfParse` |
| 3 | Refactor de duplicación + archivos grandes | `479f5c4` | ⚠️ Parcial | Helpers `purchasePersistence`; partido visual diferido |
| 4 | Preparar capa multi-tenant | `1e2d7e7` | ✅ | Migration 010, policies_v2, sessionAdapter |
| 5 | UX/UI facturas | — | ⏸ Skip | Necesita input de QA del dev |
| 6 | Auth + Multi-hogar (código) | `4123562` | ✅ | Modo dual: auth real si configurada, legacy si no |

Commits adicionales del periodo:
- `2ffc626` — Script `setup_auth.sql` todo-en-uno + tipos `household_members` a mano (evita esperar regen de Supabase CLI).
- `1525c17` — `public/_redirects` para SPA fallback en Cloudflare Pages.
- `0c8406f`, `c7eaa3e`, `8154bd1` — Iteraciones para arreglar `npm ci` en Cloudflare (cross-platform optional deps).
- `a6fde82` — Eliminar referencias a Vercel tras migración a Cloudflare Pages.

---

## Hito 0 — Bug fix `useInvoiceStore.deleteInvoice`

**Bug latente detectado**: el store estaba definido como `create((set) => ({...}))` pero el método `deleteInvoice` llamaba a `get().invoices.find(...)` — `get` no estaba destructurado. Cualquier intento de borrar una factura habría fallado con `ReferenceError: get is not defined`.

**Fix**: cambiar a `create((set, get) => ({...}))`. Una línea.

**Lección**: cuando se refactorice esta zona, considerar destructurar `get`/`set` explícitamente desde el inicio en todos los stores Zustand para evitar este tipo de bugs latentes.

---

## Hito 1 — Migración a TypeScript

**Motivación**: el código JS plano dificultaba refactors grandes y el dev quería empezar a escalar. Migración completa de una vez (preferencia del dev) en lugar de gradual.

**Decisiones técnicas**:
- **Strict moderado**: `strict: true` + `strictNullChecks: true` pero `noImplicitAny: false`. Permite migrar sin tener que tipar cada variable explícitamente.
- **`allowJs: true`**: durante la migración los archivos `.js` siguen compilando, permite migrar incrementalmente.
- **Tipos del schema Supabase autogenerados** con `npx supabase gen types typescript`.
- **Project references**: `tsconfig.json` con references a `tsconfig.app.json` (browser) y `tsconfig.node.json` (vite.config).

**Sub-fases ejecutadas**:
1. Setup: tsconfig, deps (`typescript`, `@types/node`, `typescript-eslint`, `supabase`), eslint config, `vite-env.d.ts`.
2. Tipos del dominio en `src/types/domain.ts` (interfaces para `Product`, `Invoice`, `PriceRecord`, `Category`, `Household`, `Profile`, `BatchLine`, etc.) + `src/types/supabase.ts` autogenerado.
3. Migración de `src/lib/*.js` → `.ts` (6 archivos).
4. Migración de `src/store/*.js` → `.ts` (5 archivos, stores Zustand tipados con `create<State>((set, get) => ...)`).
5. Migración de `src/hooks/*.js` → `.ts` (1 archivo).
6. Migración de `src/data/*.js` → `.ts` (4 archivos, incluido `category_styles.ts` con ~190 iconos).
7. Migración de `src/components/**/*.jsx` → `.tsx` (12 archivos).
8. Migración de `src/views/**/*.jsx` → `.tsx` (11 archivos — los más complejos).
9. Verificación: `npm run type-check`, `npm run build`, `npm run dev` todos verdes.

**Patrones aplicados consistentemente**:
- `s.user?.currentHouseholdId` en lugar de `s.user.currentHouseholdId` (null-safe).
- `useState<T | null>(null)` donde después se setean objetos.
- `useRef<HTMLInputElement>(null)` para refs de DOM.
- `(err as Error)?.message` para errores devueltos como `unknown` por los stores.
- Tipos `ValidLine`, `LineDraft`, `GastoCategory`, etc. extraídos como interfaces locales en los views.

**Total**: 167 errores de TypeScript resueltos durante el proceso.

**Deuda en este hito**:
- Los archivos `FacturasListSection.tsx` (~950 líneas) y `RegistrarCompra.tsx` (~1300 líneas) tienen tipos funcionales pero no elegantes (mucho `as Error` casting). Cuando se partan en sub-componentes (hito futuro) se podrá refinar el tipado.

---

## Hito 2 — Tests del parser de facturas

**Motivación**: el código más frágil del proyecto eran los parsers de PDFs (Cañaveral SIESA, D1) y XMLs UBL DIAN. Sin tests, cualquier refactor o cambio de formato podía romper la importación silenciosamente.

**Decisiones técnicas**:
- **Vitest 4** + **happy-dom** (no es necesario pero queda preparado para tests con DOM en el futuro).
- **Refactor previo**: extraer las funciones puras de parsing (sin pdf.js) a `src/lib/invoicePdfParse.ts`. Esto permite testearlas en Node sin DOM. `src/lib/invoicePdfImport.ts` queda como wrapper de pdf.js + re-exports.
- **Fixtures sintéticos** representativos (no PDFs binarios reales): texto extraído de PDFs Cañaveral en formato SIESA + XMLs UBL DIAN con AttachedDocument + CDATA.

**Suite (34 tests)**:
- `invoicePdfParse.test.ts`: 20 tests cubriendo `normalizeBarcode`, `parseMoney`, `parseInvoiceDate`, `parseInvoiceTotalCop`, `guessStoreLabelFromPdfText`, `parseCanalaveralStyleLineItems` (incluye edge case de unitPrice corregido por heurística >12%), `parseLineItemsForSource`, `buildBarcodeToProductIdMap`, `parsedItemsToBatchLines`, `parsePdfForBatchForm`.
- `canalXmlImport.test.ts`: 14 tests cubriendo `normKey`, `buildNormNameToProductIdMap`, `extractEmbeddedInvoiceXml` (CDATA + Invoice directo + no match), `parseUblInvoiceLineItems` (incluye redistribución de totales para cuadrar con TaxInclusiveAmount), `parseElectronicInvoiceXmlForBatch`, `applyNameFallbackToBatchLines` (respeta matches previos).

**Resultado**: 34/34 verdes. Cualquier regresión en parsing falla un test concreto.

---

## Hito 3 — Refactor de duplicación + archivos grandes

**Motivación original** (del plan inicial):
1. Extraer `<PurchaseForm>` (mini-form repetido en 3 lugares).
2. Partir `RegistrarCompra.tsx` (1300 líneas) en sub-componentes.
3. Partir `FacturasListSection.tsx` (800 líneas) en sub-componentes.
4. Unificar `persistSinglePurchase` y reconciliación de stock en `purchasePersistence.ts`.

**Lo que se hizo**:
- ✅ **Helper `src/lib/purchasePersistence.ts`** con dos funciones:
  - `recordPurchaseLine`: crea `price_record` + actualiza stock respetando `pending_registration` y `linked_product_id`.
  - `revertPurchaseLine`: borra `price_record` + revierte stock.
- ✅ **Refactor de `RegistrarCompra.persistSinglePurchase`** para usar `recordPurchaseLine`.
- ✅ **Refactor de `FacturasListSection.saveFullEdit`** para usar `revertPurchaseLine` (líneas eliminadas) y `recordPurchaseLine` (líneas nuevas).
- ✅ **~150 líneas de duplicación eliminadas**.

**Lo que se difirió** (a un hito futuro):
- Partir `RegistrarCompra.tsx` en `<PendingRegistrationPanel>`, `<BatchInvoiceForm>`, `<IndividualPurchaseForm>`.
- Partir `FacturasListSection.tsx` en `<InvoiceCard>` + `<InvoiceEditor>`.
- Extraer `<PurchaseFormFields>` (la pieza UI repetida del mini-form de compra).

**Por qué se difirió**: el partido visual es trabajo de varias horas con riesgo de romper comportamiento. La deduplicación de lógica ya da el 80% del valor sin riesgo. Cuando se retome, probablemente conviene hacerlo después de Hito 6 (auth activado) cuando no haya grandes cambios estructurales pendientes.

---

## Hito 4 — Preparar capa multi-tenant (sin activar)

**Motivación**: dejar todo listo para activar Supabase Auth + multi-hogar sin tener que reescribir el código de los consumidores.

**Lo que se hizo**:
- ✅ **Migration `010_household_members.sql`**: tabla pivote `(user_id, household_id, role)` con roles `owner`/`member`. Con RLS `allow_all` por ahora.
- ✅ **`supabase/policies_v2.sql`**: policies reales basadas en `auth.uid()` + helpers `user_belongs_to_household` y `user_is_owner_of_household`. **No se aplican** en este hito — están listas para cuando se active auth.
- ✅ **`src/lib/sessionAdapter.ts`**: capa intercambiable que abstrae cómo se obtiene el user actual y los hogares. En este hito devuelve siempre el snapshot legacy (`first profile` del hogar hardcodeado).
- ✅ **`useAuthStore`** consume el adapter en lugar de la query directa a Supabase. Listo para que solo cambie la implementación del adapter cuando se active auth.

**Esquema base no cambió**: ya estaba bien preparado para multi-tenant (`household_id` en todas las tablas, FKs con cascade, RLS habilitada). Solo faltaba la tabla pivote y las policies reales.

---

## Hito 5 — UX/UI facturas

**Estado**: ⏸ **SKIP** — necesita input de QA del dev.

**Motivación**: mejorar fricciones concretas del flujo de facturas (importar, revisar, guardar, editar). El plan original tenía hipótesis pero esperaba feedback específico del dev tras probar la app.

**Hipótesis que quedaron sin priorizar**:
- Validación visual del matching antes de guardar (qué líneas matchearon, cuáles no, sugerir manualmente).
- Preview del PDF al lado del formulario al importar.
- Drag & drop de PDF/XML.
- Auto-detectar fuente (Cañaveral vs D1) sin que el user elija.
- Re-mapeo masivo (todas las líneas de la cadena X → producto Y).
- Mejor visualización del mismatch entre total declarado y suma de líneas.

**Cómo retomar**: cuando el dev haga QA y descubra los pain points reales, abrir un hito específico con esos pain points priorizados.

---

## Hito 6 — Auth + Multi-hogar (código)

**Motivación**: habilitar multi-cuenta y multi-hogar reales. El código se implementa con **backward compatibility**: la app sigue funcionando en modo legacy mientras no se configure Google OAuth en el dashboard.

**Lo que se hizo (código)**:
- ✅ **`sessionAdapter` v2**: detecta si hay sesión de Supabase Auth (`auth.getUser()`). Si sí, lee `household_members` para listar hogares. Si no, fallback al snapshot legacy.
- ✅ **`useAuthStore`**: nuevos métodos `signInWithGoogle`, `signOut`, `refresh`. El `init()` suscribe a `onAuthStateChange` para refrescar el snapshot ante cambios de sesión.
- ✅ **`src/views/Login.tsx`**: pantalla con botón "Continuar con Google" (solo se muestra si auth está activo y no hay sesión).
- ✅ **`src/views/Onboarding.tsx`**: pantalla para crear el primer hogar tras el primer login (inserta en `households` + se agrega a sí mismo en `household_members` como `owner`).
- ✅ **`AvatarMenu` actualizado**: switcher de hogar (cuando `households.length > 1`) + logout funcional.
- ✅ **`NavUserStrip`**: botón de logout activo solo si hay sesión real.
- ✅ **`App.tsx`** orquesta los 3 estados: `loading` → `login` → `onboarding` → `app`.

**Activación (manual, en hold)**:
1. Configurar Google OAuth en Google Cloud Console.
2. Habilitar el provider Google en Supabase Auth + setear Site URL y Redirect URLs.
3. Primer login con `jucapo05@gmail.com` (crea row en `auth.users`).
4. Ejecutar `supabase/setup_auth.sql` en SQL Editor (script atómico con rollback que crea `household_members`, te inserta como owner del hogar legacy heredando toda la data actual, y reemplaza las policies `allow_all` por las RLS reales).
5. Recargar app — verás tu inventario completo con tu cuenta Google.

**Guía paso a paso**: `docs/ACTIVATE_AUTH.md`.

**Decisión clave del script `setup_auth.sql`**: todo en una transacción (`begin`/`commit`). Si cualquier paso falla, rollback completo y la app sigue funcionando en modo legacy. Es seguro intentarlo.

**Tipos `household_members`**: agregados a mano en `src/types/supabase.ts` para no tener que esperar a regenerar los tipos tras aplicar la migration. Cuando se ejecute `npx supabase gen types typescript` se sobrescribirán (y se podrá borrar la edición manual).

---

## Migración de hosting (post-hito 6)

Durante esta sesión apareció un tema separado: la cuenta Vercel del dev tenía $80 acumulados por uso del plan Pro (que se activó automáticamente sin que el dev lo notara). Decidimos migrar a Cloudflare Pages.

**Pasos completados**:
- ✅ `public/_redirects` con `/* /index.html 200` para SPA fallback en Cloudflare.
- ✅ Setup en Cloudflare Pages dashboard (Framework: Vite, Build: `npm run build`, Output: `dist`).
- ✅ Env vars `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` configuradas.
- ✅ Fix de `npm ci` cross-platform: `@emnapi/core` y `@emnapi/runtime` agregados como `devDependencies` para forzar nodes propios en el lock (sin esto fallaba en Linux).
- ✅ Eliminación de `vercel.json` y referencias a Vercel en docs.

**URL actual**: `https://domus-236.pages.dev`.

**Pendiente del dev**:
- Confirmar con soporte de Vercel la resolución de los $80.
- Eliminar el proyecto Domus de Vercel.
- (opcional) Eliminar el Team de Vercel si solo se usaba para Domus.

---

## Estado al cierre de la sesión

| Área | Estado |
|---|---|
| Código | TypeScript strict moderado, todo verde |
| Tests | 34/34 verdes (parsers de facturas) |
| Hosting | Cloudflare Pages (`https://domus-236.pages.dev`) |
| Auth | Código listo, **activación en hold** |
| Hito 3 visual | Diferido (partido en subcomponentes) |
| Hito 5 UX facturas | Skip (espera input de QA) |

## Cómo retomar

1. Leer `CLAUDE.md` (raíz) — punto de entrada con stack, invariantes, estado.
2. Para activar auth: seguir `docs/ACTIVATE_AUTH.md`.
3. Para entender el plan en detalle: este archivo.
4. Para entender bugs encontrados / decisiones: leer mensajes de commits del periodo `41175f7..a6fde82`.
