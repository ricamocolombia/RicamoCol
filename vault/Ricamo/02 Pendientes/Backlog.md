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
- [x] Tipos TypeScript reales escritos a mano en `packages/supabase/src/types.ts` (2026-08-27), a partir del `.sql` — reemplaza el placeholder `Record<string, unknown>`. Sin CLI todavía, pero ya tipa correctamente todos los `.insert()`/`.update()`/`.select()` del admin. Si más adelante se consigue el access token de Supabase, se puede regenerar con el CLI y comparar contra este archivo.
- [x] `supabase/migrations/0002_grants.sql` aplicada (2026-08-27) — se encontró y corrigió el bug de permisos faltantes; verificado con lectura/escritura real contra las 17 tablas.
- [ ] **BLOQUEANTE**: falta aplicar `supabase/migrations/0003_crm.sql` al proyecto real (agrega `customers.city` y la tabla `marketing_campaigns`). Sin esto, el módulo de Clientes/Campañas/Dashboard/Diseño→Producto de hoy compila pero no funciona en vivo (verificado: falla con "column customers.city does not exist" / "table marketing_campaigns not found"). Mismo procedimiento: pegar el `.sql` en el SQL Editor del Dashboard de Supabase.
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
- [x] Autenticación (login) para la app admin vía Supabase Auth (2026-08-27) — middleware protege todas las rutas, `/login` con email+password, logout en el dashboard. Primera cuenta creada (`juancamilo965@gmail.com`) con `pnpm create-admin-user <email> <password>` (usa la service_role key, sin flujo de auto-registro).
- [x] **Los 9 módulos del panel construidos (2026-08-27)** con 4 agentes en paralelo — listado real + alta conectados a Supabase en Ventas, Compras, Inventario, Proveedores, Bancos, Cuentas por cobrar, Cuentas por pagar, Domiciliarios y Diseños. Compila sin errores (`pnpm build` limpio, tipos reales, sin `as any`/`as never`), **pero sin verificar en vivo todavía** — ver el bloqueante de `0002_grants.sql` arriba. Detalle de cada módulo en `01 Progreso/2026-08-27.md`.
- [ ] Gestión de usuarios del panel (invitar/desactivar cuentas de Maria Jose y su equipo) — hoy solo existe el script de CLI, no una pantalla.
- [x] **Módulo de clientes construido** (2026-08-27, `apps/admin/app/clientes`) — lista con segmento de recompra (Nuevo/Recurrente/Inactivo/Sin compras, calculado en `lib/metrics.ts`), ficha de cliente con historial de pedidos y edición, alta manual. Requiere `0003_crm.sql` (columna `city`) aplicada para funcionar.
- [x] **Módulo de campañas de marketing construido** (2026-08-27, `apps/admin/app/campanas`) — crear campaña (asunto + mensaje + segmento objetivo), enviar por correo vía Resend a los clientes con email que calcen con el segmento. Solo email por ahora (no hay integración de WhatsApp Business API); envío secuencial con tope de 500 destinatarios por campaña — si la base de clientes crece mucho, esto debería moverse a un job en background en vez de una Server Action. Requiere `0003_crm.sql` + `RESEND_API_KEY`/`RESEND_FROM_EMAIL` configurados para poder enviar de verdad (crear campañas en borrador ya funciona sin eso).
- [x] **Dashboard con métricas reales construido** (2026-08-27, `apps/admin/app/page.tsx`) — ventas totales, ingresos cobrados, ticket promedio, % de recompra, ingresos/salidas/balance de bancos, cuentas por cobrar/pagar pendientes, pedidos por estado, stock en alerta, top 5 ciudades por venta, top 5 clientes por valor, ventas por origen, gastos por categoría. Todo calculado en memoria a partir de los datos ya existentes (no hay vistas SQL agregadas todavía) — si el volumen de datos crece mucho, valdría la pena mover esto a vistas o funciones de Postgres.
- [x] **Diseño → Producto de catálogo, solo con aprobación del admin** (2026-08-27) — un diseño solo puede convertirse en `product` vendible si su estado es `aprobado` o `enviado_maquiladora` (validado también en el servidor, no solo en la UI), vía una acción explícita "Crear producto y publicar" en `/disenos/[id]/publicar`. Publicar/despublicar después de creado alterna `products.is_published` (fuente de verdad) y sincroniza `designs.published_to_ecommerce`.
- [ ] Editar/eliminar ventas y compras existentes — se priorizó listar+crear funcionando en la primera pasada, como se pidió; falta esa segunda mitad del CRUD.
- [ ] UI para agregar múltiples líneas de producto por venta/compra (hoy cada venta/compra nueva soporta un solo renglón de línea).
- [ ] `deliveries` (tabla de envíos con estado propio pendiente/en_camino/entregado/fallido) no se usa todavía — Ventas solo asocia un `courier_id` directo a la orden, no crea un registro de envío separado con dirección.
- [ ] Un producto creado desde un diseño solo queda con una talla/variante (la del formulario de publicación) — agregar más tallas/colores hoy requiere entrar directo a Supabase.
- [ ] Subida de imágenes para diseños (`designs.image_url` es hoy un campo de texto libre, sin integración con Supabase Storage).
- [ ] Trigger/cron que marque `status = 'vencido'` automáticamente en `accounts_receivable`/`accounts_payable` al pasar la fecha de vencimiento — hoy el "vencido" se calcula solo visualmente en la UI comparando la fecha.
- [ ] Revisar si `transactions.reference_order_id`/`reference_purchase_id` (y los de `inventory_movements`) deberían tener foreign key real hacia `orders`/`purchases` — hoy son UUID sueltos validados solo por formato, a diferencia de `accounts_receivable.order_id`/`accounts_payable.purchase_id` que sí tienen FK.
- [ ] Compra con renglón de "descripción libre" (sin `inventory_item_id`) que llega como "recibida" no genera movimiento de inventario automático — es inherente a que el campo es opcional, decidir si vale la pena resolverlo (¿crear el ítem de inventario al vuelo?).

## Integración
- [ ] Webhook/Server Action que registre automáticamente en `orders` cada venta hecha desde el ecommerce.
- [ ] Publicar diseño desde admin → visible en catálogo web (toggle `published_to_ecommerce`).
- [ ] Notificaciones por email (Resend): confirmación de pedido, alertas de cuentas por pagar próximas a vencer.

## Infraestructura
- [x] Repo conectado a Vercel por el usuario (proyecto `ricamo-col-a...` para `@ricamo/admin`). El primer deploy falló por build estático + variables de entorno faltantes — corregido el 2026-08-27 (ver nota de progreso). Falta confirmar si `@ricamo/web` también tiene su propio proyecto en Vercel.
- [ ] Variables de entorno en Vercel: confirmar que además de `NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_ANON_KEY` (Type "Config", no "Secret" — son públicas por diseño) están `SUPABASE_SERVICE_ROLE_KEY`/`RESEND_API_KEY`/`RESEND_FROM_EMAIL` (Type "Secret"/"Config" según corresponda) para que el panel funcione en producción y no solo compile.
- [x] Primer commit + push a GitHub hecho (2026-08-27).
