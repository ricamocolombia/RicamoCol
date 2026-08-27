# Backlog de pendientes — Ricamo

Lista viva. Al iniciar una sesión, revisar esta nota. Al cerrar una sesión, mover lo resuelto a la nota de progreso del día (en `01 Progreso/`) y actualizar esta lista.

## Bloqueado por el usuario
- [x] Logo oficial recibido y cargado en el repo (2026-08-27) — `apps/web/public/brand/` y `apps/admin/public/brand/`, conectado en headers y favicons. Colores `#F5C518` (amarillo) / `#0A0A0A` (negro) confirmados como estandar de facto — no existe manual de marca formal.
- [ ] Confirmar si el WhatsApp del negocio es 3216245987 (+57), visto en el Instagram @ricamo_col.
- [ ] Elegir pasarela de pago para Colombia (Wompi / MercadoPago / PayU).
- [ ] Dominio del sitio.
- [x] Proyecto de Supabase creado (2026-08-27): `https://jeebrphbdcuhfkyhicmq.supabase.co`. URL + anon key + service role key guardadas en `apps/web/.env.local` y `apps/admin/.env.local` (nunca en la bóveda ni en git). Falta crear el proyecto de Resend.
- [x] Repo remoto de GitHub confirmado y con el primer push hecho (2026-08-27): `https://github.com/ricamocolombia/RicamoCol.git`, rama `main` trackeando `origin/main`. Se autenticó con un Personal Access Token del usuario, usado una sola vez en el comando de push (nunca guardado en el remoto ni en ningún archivo).
- [ ] Contenido de marca personal de Maria Jose (bio, redes, fotos, historia) más allá de lo público en Instagram.
- [ ] Personal access token de Supabase (desde supabase.com/dashboard/account/tokens) o la contraseña de la base de datos, para poder aplicar la migración por CLI sin intervención manual — `supabase link` falló con "Unauthorized" sin esto.

## Backend / datos
- [x] `pnpm install` ejecutado y `pnpm build` verificado en ambas apps (2026-08-27) — compilan sin errores con las credenciales reales de Supabase.
- [x] Migración `supabase/migrations/0001_init.sql` aplicada al proyecto real (2026-08-27) — el usuario la pegó directamente en el SQL Editor del Dashboard de Supabase.
- [ ] Generar tipos TypeScript reales desde Supabase (reemplazar `packages/supabase/src/types.ts`) — requiere el access token de Supabase de arriba, o se puede escribir a mano a partir del `.sql` mientras tanto.
- [ ] Definir políticas RLS finales (hoy solo hay lectura pública de `products`/`designs` publicados).

## Ecommerce (apps/web)
- [ ] Evaluar si `products`/`designs` necesitan un campo de categoría/colección (ej. "camisetas de pareja", "orgullo regional/viajes", "humor") — visto como líneas de producto reales en el Instagram @ricamo_col, no modelado todavía en el esquema.
- [ ] Construir catálogo real (listado + detalle de producto) conectado a Supabase.
- [ ] Construir formulario de cotización personalizada → WhatsApp.
- [ ] Integrar pasarela de pago para el catálogo.
- [ ] Diseñar la página de marca personal de Maria Jose.
- [x] Logo real conectado en header (`app/layout.tsx`) y favicon (`app/icon.png`) del ecommerce.
- [ ] Definir tipografía de marca (hoy se usa la fuente por defecto de Tailwind, no la del logo).

## App admin (apps/admin)
- [ ] CRUD de ventas, compras, inventario.
- [ ] CRUD de cuentas por cobrar / cuentas por pagar.
- [ ] CRUD de bancos + registro de movimientos (ingresos/salidas).
- [ ] CRUD de proveedores y domiciliarios.
- [ ] Módulo de diseños con botón "Publicar en ecommerce".
- [x] Autenticación (login) para la app admin vía Supabase Auth (2026-08-27) — middleware protege todas las rutas, `/login` con email+password, logout en el dashboard. Primera cuenta creada (`juancamilo965@gmail.com`) con `pnpm create-admin-user <email> <password>` (usa la service_role key, sin flujo de auto-registro).
- [ ] Gestión de usuarios del panel (invitar/desactivar cuentas de Maria Jose y su equipo) — hoy solo existe el script de CLI, no una pantalla.

## Integración
- [ ] Webhook/Server Action que registre automáticamente en `orders` cada venta hecha desde el ecommerce.
- [ ] Publicar diseño desde admin → visible en catálogo web (toggle `published_to_ecommerce`).
- [ ] Notificaciones por email (Resend): confirmación de pedido, alertas de cuentas por pagar próximas a vencer.

## Infraestructura
- [ ] Conectar repo a Vercel (dos proyectos: web y admin, o un proyecto con dos apps).
- [ ] Variables de entorno en Vercel (Supabase, Resend, pasarela de pago, WhatsApp) — mismos valores que en los `.env.local`.
- [x] Primer commit + push a GitHub hecho (2026-08-27).
