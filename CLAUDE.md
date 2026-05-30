# Domus

App web para control de compras e inventario del hogar. Visión: multi-cuenta, multi-hogar, eventualmente PYMEs pequeñas.

## Stack

| Capa | Tecnología |
|---|---|
| Frontend | React 19 + Vite 8 + TailwindCSS 4 + React Router 7 |
| Estado | Zustand 5 (un store por dominio) |
| Lenguaje | TypeScript (strict moderado: `strict: true`, `noImplicitAny: false`, `strictNullChecks: true`) |
| Backend | Supabase (Postgres + Storage + Auth + RLS) |
| Auth | Supabase Auth con Google OAuth (código listo, activación en hold — ver `docs/ACTIVATE_AUTH.md`) |
| Tests | Vitest 4 + happy-dom (suite cubre parsers de facturas) |
| Hosting | Cloudflare Pages — `https://domus-236.pages.dev` |
| Project Supabase | `fsepmdkrtzmjvrdykrej` |

## Comandos

```bash
npm run dev          # dev server (vite)
npm run build        # tsc -b && vite build
npm run preview      # servir build local
npm run type-check   # tsc -b --pretty
npm run lint         # eslint
npm test             # vitest run
npm run test:watch   # vitest watch
```

## Estructura

```
src/
├── main.tsx                 # entry
├── App.tsx                  # rutas + estados loading/login/onboarding/app
├── types/
│   ├── domain.ts            # interfaces del dominio (Product, Invoice, etc.)
│   ├── supabase.ts          # tipos del schema (autogenerados + household_members agregado a mano)
│   └── index.ts             # barrel
├── lib/
│   ├── supabase.ts          # cliente tipado
│   ├── sessionAdapter.ts    # adapter dual: auth real si hay sesión, legacy si no
│   ├── purchasePersistence.ts  # helpers compartidos (recordPurchaseLine, revertPurchaseLine)
│   ├── invoicePdfParse.ts   # parsers PUROS (testeables sin DOM)
│   ├── invoicePdfImport.ts  # wrapper pdf.js + re-exports de parse
│   ├── canalXmlImport.ts    # parser UBL DIAN
│   ├── productDisplay.ts    # chips meta de productos
│   ├── storage.ts           # upload de imágenes a Supabase Storage
│   ├── textCase.ts          # toTitleCase
│   └── __tests__/           # fixtures + suite Vitest
├── store/
│   ├── useAuthStore.ts      # usa sessionAdapter; soporta auth Google + modo legacy
│   ├── useProductStore.ts   # inventario; respeta linked_product_id
│   ├── useCategoryStore.ts
│   ├── usePriceStore.ts
│   └── useInvoiceStore.ts   # facturas + cascade delete (revierte inventario)
├── data/
│   ├── units.ts             # BASE_UNITS, PACKAGE_UNITS, anchor helpers
│   ├── category_styles.ts   # ~190 iconos + paletas
│   ├── invoiceSources.ts    # cadenas soportadas (Cañaveral, D1/Carulla)
│   └── pageTitles.ts
├── hooks/
│   └── useCategoryAccordion.ts  # collapse persistido en localStorage
├── components/
│   ├── Layout.tsx, Sidebar.tsx, MobileHeader.tsx, MobileNavDrawer.tsx
│   ├── SideNavBody.tsx, NavUserStrip.tsx, AvatarMenu.tsx
│   ├── CategorySection.tsx, BlockingLoadingOverlay.tsx
│   ├── ImageUploader.tsx, AppDialogs.tsx
│   └── nav-items.ts
└── views/
    ├── Inventario.tsx              # /
    ├── PorComprar.tsx              # /por-comprar
    ├── RegistrarCompra.tsx         # /registrar-compra (núcleo de compras)
    ├── HistorialCompras.tsx        # /historial-compras (tabs)
    ├── FacturasListSection.tsx     #   ↳ tab Facturas
    ├── IndividualPurchasesHistory.tsx  # ↳ tab Registros individuales
    ├── HistoricoPrecios.tsx        # /historico-precios
    ├── Gastos.tsx                  # /gastos
    ├── GestionCategorias.tsx       # /gestion/categorias
    ├── GestionProductos.tsx        # /gestion/productos
    ├── preciosShared.tsx           # helpers compartidos UI
    ├── Login.tsx                   # solo activa si Supabase Auth está configurado
    └── Onboarding.tsx              # crear primer hogar tras primer login
```

## Modelo de datos (Supabase)

Schema completo en `supabase/schema.sql` + migrations en `supabase/migrations/`.

| Tabla | Campos clave |
|---|---|
| `households` | `id`, `name` |
| `profiles` | `id`, `name`, `email`, `household_id` (legacy 1:1) |
| `household_members` | `user_id`, `household_id`, `role` (`owner`/`member`) — pivote multi-tenant, no activado |
| `categories` | `id`, `household_id`, `name`, `icon`, `color` *(unique: household+name)* |
| `products` | `name`, `quantity`, `display_unit`, `content_amount/unit`, `linked_product_id`, `linked_units_per_package`, `barcode`, flags `in_shopping_list`/`pending_registration`/`visible_in_inventory` |
| `invoices` | `store`, `invoice_date`, `total_cop` |
| `price_records` | `product_id`, `price` (unitario), `quantity`, `store`, `invoice_id?`, `for_third_party` |

## Convenciones e invariantes críticos (NO romper)

1. **Anclaje de productos**: si `product.linkedProductId` está seteado, mutaciones de stock DEBEN pasar por `addInventoryFromPurchase` / `subtractInventoryFromPurchase` (respetan `linkedUnitsPerPackage`). NUNCA mutar `quantity` con un `update({ quantity })` directo — rompe el contador del producto base.
2. **Redondeo entero**: al sumar/restar stock por compras: `Math.max(1, Math.round(qty))`. Aplica también al revertir.
3. **Persistencia de compras**: usa `recordPurchaseLine` / `revertPurchaseLine` de `src/lib/purchasePersistence.ts`. No duplicar la lógica de "addRecord + completeRegistration | addInventoryFromPurchase".
4. **Diálogos**: usar `AlertDialog` / `ConfirmDialog` de `components/AppDialogs.tsx`. Nunca `window.alert/confirm`.
5. **Cross-store en Zustand**: usar `useOtroStore.getState()` (ver `useInvoiceStore.deleteInvoice`). Evitar ciclos de imports.
6. **`s.user?.currentHouseholdId`** — siempre con `?.` porque `user` puede ser null (no logueado). Si necesitas el id obligatorio para una operación, valida con `if (!householdId) return`.
7. **`pending_registration` no se restaura al borrar factura** — decisión consciente (no hay forma de saber el estado anterior sin auditoría).
8. **Title casing**: nombres de productos se normalizan en UI con `toTitleCase`, no en datos almacenados.

## Estado actual

- **Hostingen producción**: Cloudflare Pages (`https://domus-236.pages.dev`).
- **Auth real está en hold**: el código soporta Supabase Auth + multi-hogar pero la activación (configurar Google OAuth + aplicar `setup_auth.sql`) está pausada. La app corre en modo **legacy** (un solo profile, hogar `00000000-0000-0000-0000-000000000001` hardcodeado, RLS `allow_all`). Para activar ver `docs/ACTIVATE_AUTH.md`.
- **Plan de optimización 2026-05 completado** (excepto Hito 5 que necesita feedback de QA). Ver `docs/PLAN_OPTIMIZACION_2026_05.md`.

## Cómo desarrollar

1. `.env.local` debe tener `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`.
2. `npm install` + `npm run dev`.
3. Antes de PR: `npm run type-check && npm test && npm run build`.

## Cómo deployar

Push a `main` dispara build automático en Cloudflare Pages. Build command: `npm run build`, output dir: `dist`. Las env vars de Supabase se configuran en el dashboard de Cloudflare.

## Activación de auth (cuando se retome)

Sigue `docs/ACTIVATE_AUTH.md` paso a paso. El script SQL todo-en-uno es `supabase/setup_auth.sql` (atómico: si algo falla hace rollback).

## Docs útiles

- `docs/PLAN_OPTIMIZACION_2026_05.md` — detalle de todo el plan de optimización (hitos, decisiones, pendientes).
- `docs/ACTIVATE_AUTH.md` — guía paso a paso para activar Google OAuth + multi-hogar real.
- `supabase/setup_auth.sql` — script todo-en-uno para la activación.
- `supabase/policies_v2.sql` — RLS reales (ya incluidas en setup_auth.sql).

## Trampas conocidas

- **CLI de Supabase** (`npx supabase gen types typescript`) inyecta una etiqueta `<claude-code-hint .../>` al final del archivo generado. Hay que borrarla manualmente, rompe TS.
- **Proyecto Supabase free se pausa por inactividad**. Si comandos del CLI fallan con "project must be active", restaurarlo en el dashboard.
- **`@emnapi/core` y `@emnapi/runtime`** están en `devDependencies` aunque parecen redundantes. Sin ellas el lock no incluye los nodes necesarios y `npm ci` falla en Cloudflare (Linux). Ver commit `8154bd1` si dudas en quitarlas.
