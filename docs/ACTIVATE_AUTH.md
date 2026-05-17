# Activar auth real (Google) + atar tu data a tu cuenta

El código ya soporta auth real (Hito 6 del plan de optimización 2026-05).
Mientras no hagas estos pasos, la app sigue en modo legacy (un solo
profile, hogar único hardcodeado).

Este doc te lleva del modo legacy a **auth real con jucapo05@gmail.com
heredando todo el inventario, facturas, precios y gastos actuales**.

---

## Fase 1 — Google Cloud (OAuth credentials)

1. [Google Cloud Console → APIs & Services → Credentials](https://console.cloud.google.com/apis/credentials).
2. Crea o selecciona un proyecto.
3. **Configure consent screen** (User Type: External). Nombre: `Domus`, tu email.
4. **Create credentials → OAuth client ID**:
   - Application type: `Web application`
   - Name: `Domus`
   - **Authorized JavaScript origins**:
     - `http://localhost:5173`
     - `https://<tu-dominio>.vercel.app`
   - **Authorized redirect URIs**:
     - `https://fsepmdkrtzmjvrdykrej.supabase.co/auth/v1/callback`
5. Copia el **Client ID** y **Client Secret**.

## Fase 2 — Habilitar Google OAuth en Supabase

1. [Dashboard → Authentication → Providers → Google](https://supabase.com/dashboard/project/fsepmdkrtzmjvrdykrej/auth/providers).
2. Toggle **Enabled**, pega Client ID y Client Secret, **Save**.
3. [Authentication → URL Configuration](https://supabase.com/dashboard/project/fsepmdkrtzmjvrdykrej/auth/url-configuration):
   - **Site URL**: la URL de Vercel.
   - **Redirect URLs**: agregar `http://localhost:5173/**` y la URL de Vercel.

## Fase 3 — Primer login (para crear tu row en `auth.users`)

1. Abre la app (Vercel o local).
2. Verás la pantalla de **Login**.
3. Logueate con **jucapo05@gmail.com**.
4. Verás la pantalla de **Onboarding** ("Crea tu primer hogar"). **NO crees nada todavía** — déjala abierta sin hacer click.

   En este punto tu user ya existe en `auth.users` pero todavía no eres miembro de ningún hogar.

## Fase 4 — Aplicar setup_auth.sql (todo-en-uno)

[SQL Editor](https://supabase.com/dashboard/project/fsepmdkrtzmjvrdykrej/sql/new) → pegar el contenido completo de [`supabase/setup_auth.sql`](../supabase/setup_auth.sql) y ejecutar.

El script hace, en una sola transacción (con rollback si algo falla):

1. Verifica que `jucapo05@gmail.com` existe en `auth.users`.
2. Crea la tabla `household_members`.
3. Te inserta como **owner** del hogar legacy (`00000000-0000-0000-0000-000000000001`).
4. Reemplaza las policies `allow_all` por RLS reales basadas en `auth.uid()` + membresía.

**Verificación** (descomenta el SELECT del final del script):

```sql
select hm.role, h.name
from public.household_members hm
join public.households h on h.id = hm.household_id
where hm.user_id = (select id from auth.users where email = 'jucapo05@gmail.com');
```

Debes ver: `owner | <nombre de tu hogar legacy>`.

## Fase 5 — Recargar la app

Recarga la página. La pantalla de Onboarding desaparece y entras directo al inventario con toda tu data (productos, facturas, gastos del histórico).

---

## Si algo sale mal

### "No existe ningún user con email jucapo05@gmail.com"
No completaste la Fase 3 (login). Hazlo y vuelve a correr el script.

### Después de la Fase 4 ya no veo mis datos
Significa que el INSERT en `household_members` no se aplicó (o el household_id es otro). Verifica con el SELECT de la Fase 4. Si está vacío, corre solo el bloque INSERT del `setup_auth.sql` manualmente.

### Quedó algo a medias y la app no carga
Como último recurso, restaura las policies viejas (te devuelve la app a modo "allow_all" mientras debuggeas):

```sql
drop policy if exists "household_member_read" on public.households;
drop policy if exists "household_owner_update" on public.households;
-- ... (repetir para cada policy del setup_auth.sql)

create policy "allow_all" on public.households for all using (true) with check (true);
create policy "allow_all" on public.profiles for all using (true) with check (true);
-- ... (repetir para todas las tablas)
```

---

## Después

### Invitar a otra persona al hogar (manual por ahora)

El flujo de invitaciones UI no está implementado. Para añadir a tu pareja:

1. Que se loguee una vez con su cuenta de Google (esto crea su `auth.users`).
2. SQL Editor:

```sql
insert into public.household_members (user_id, household_id, role)
values (
  (select id from auth.users where email = 'pareja@gmail.com'),
  '00000000-0000-0000-0000-000000000001',
  'member'
);
```

Cuando ella recargue verá tu inventario.

### Regenerar tipos de Supabase (opcional)

Los tipos de `household_members` están escritos a mano en `src/types/supabase.ts`. Si en algún momento corres `npx supabase gen types typescript --project-id fsepmdkrtzmjvrdykrej > src/types/supabase.ts`, vas a sobrescribir el archivo con los autogenerados (que ya van a incluir `household_members` porque la tabla ya existe). Recuerda borrar la última línea `<claude-code-hint ... />` que inyecta el CLI.
