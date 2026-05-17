# Activar Supabase Auth + Multi-hogar

El código ya soporta auth real (Hito 6 del plan de optimización 2026-05).
Hasta que sigas estos pasos en el dashboard, la app sigue funcionando en
modo legacy (un solo profile, hogar único hardcodeado).

## 1. Aplicar la migration `010_household_members.sql`

En el [SQL Editor de Supabase](https://supabase.com/dashboard/project/fsepmdkrtzmjvrdykrej/sql/new),
pega y ejecuta el contenido de:

```
supabase/migrations/010_household_members.sql
```

Esto crea la tabla `household_members(user_id, household_id, role)`.

## 2. Habilitar Google OAuth

Dashboard → Authentication → Providers → Google → toggle "Enable Sign in with Google".

Necesitas:
- `Client ID` y `Client Secret` de un proyecto OAuth en [Google Cloud Console](https://console.cloud.google.com/apis/credentials).
- En "Authorized redirect URIs" del proyecto Google añadir la `Callback URL` que aparece en el Dashboard de Supabase (algo como `https://fsepmdkrtzmjvrdykrej.supabase.co/auth/v1/callback`).
- También añadir la URL de tu app (Vercel + localhost) en "Authorized JavaScript origins".

Dashboard → Authentication → URL Configuration:
- `Site URL`: la URL de Vercel (`https://domus...vercel.app`).
- `Redirect URLs`: añadir `http://localhost:5173/` además de la de Vercel.

## 3. Regenerar tipos de Supabase

Ahora que `household_members` existe, regenera los tipos:

```
npx supabase gen types typescript --project-id fsepmdkrtzmjvrdykrej > src/types/supabase.ts
```

**Importante**: el CLI inyecta una línea `<claude-code-hint .../>` al final
del archivo que rompe TS. Bórrala manualmente.

Después puedes limpiar los dos `as any` con TODO en:
- `src/lib/sessionAdapter.ts` (línea ~33)
- `src/views/Onboarding.tsx` (línea ~37)

## 4. Aplicar las RLS reales

En el SQL Editor, pega y ejecuta:

```
supabase/policies_v2.sql
```

Esto reemplaza las policies `allow_all` actuales por reglas basadas en
`auth.uid()` y membresía en `household_members`. **A partir de este punto
solo usuarios autenticados con membresía válida pueden ver/editar sus
datos**.

## 5. Migrar tus datos legacy (opcional)

Si quieres conservar el hogar y los productos que tienes hoy con tu nuevo
usuario de Google OAuth:

1. Logueate primero (la primera vez verás la pantalla de Onboarding —
   créate un hogar nuevo, llámalo cualquier cosa).
2. Anota tu `user.id` (puedes ver en la consola: `useAuthStore.getState().user.id`).
3. En el SQL Editor:

```sql
-- Reemplaza :YOUR_USER_ID con tu auth.uid()
-- Te haces miembro/owner del hogar legacy:
insert into public.household_members (user_id, household_id, role)
values (':YOUR_USER_ID', '00000000-0000-0000-0000-000000000001', 'owner')
on conflict do nothing;

-- Opcional: borra el hogar de onboarding nuevo si no lo quieres.
```

Recarga la app: ahora verás el switcher de hogar en el menú de avatar.

## 6. Invitaciones a hogar (no incluido todavía)

El plan original contemplaba flujo de invitar a otros usuarios al hogar
(tabla `invitations` + UI). No está implementado en el Hito 6. Para añadir
un miembro manualmente por ahora, inserta directamente en
`household_members` desde el SQL Editor.
