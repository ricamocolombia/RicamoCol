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
- [ ] **BLOQUEANTE**: falta aplicar `supabase/migrations/0002_grants.sql` al proyecto real. Se descubrió al probar en vivo que las tablas de `0001_init.sql` nunca recibieron los `GRANT` de Postgres necesarios — ni siquiera `service_role` puede leer/escribir ninguna tabla ahora mismo (`403 permission denied for table x`, código `42501`). RLS no es la causa; es un permiso de tabla que falta por debajo de RLS. Sin esto, **todo el módulo admin construido hoy es código sin verificar en vivo** — compila, pero no se ha podido probar contra datos reales. Mismo procedimiento que la vez pasada: pegar el `.sql` en el SQL Editor del Dashboard de Supabase.
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
- [ ] **Módulo de clientes dedicado** (`apps/admin/app/clientes`) — no existe todavía; hoy Ventas resuelve la creación/selección de cliente inline dentro del formulario de nueva venta. Varios agentes lo señalaron como el hueco más notorio del modelo actual.
- [ ] Editar/eliminar ventas y compras existentes — se priorizó listar+crear funcionando en la primera pasada, como se pidió; falta esa segunda mitad del CRUD.
- [ ] UI para agregar múltiples líneas de producto por venta/compra (hoy cada venta/compra nueva soporta un solo renglón de línea).
- [ ] `deliveries` (tabla de envíos con estado propio pendiente/en_camino/entregado/fallido) no se usa todavía — Ventas solo asocia un `courier_id` directo a la orden, no crea un registro de envío separado con dirección.
- [ ] Conectar un diseño aprobado con un `product` vendible de catálogo (`products.design_id`) — se dejó fuera de alcance a propósito en el módulo de Diseños; falta decidir ese flujo.
- [ ] Subida de imágenes para diseños (`designs.image_url` es hoy un campo de texto libre, sin integración con Supabase Storage).
- [ ] Trigger/cron que marque `status = 'vencido'` automáticamente en `accounts_receivable`/`accounts_payable` al pasar la fecha de vencimiento — hoy el "vencido" se calcula solo visualmente en la UI comparando la fecha.
- [ ] Revisar si `transactions.reference_order_id`/`reference_purchase_id` (y los de `inventory_movements`) deberían tener foreign key real hacia `orders`/`purchases` — hoy son UUID sueltos validados solo por formato, a diferencia de `accounts_receivable.order_id`/`accounts_payable.purchase_id` que sí tienen FK.
- [ ] Compra con renglón de "descripción libre" (sin `inventory_item_id`) que llega como "recibida" no genera movimiento de inventario automático — es inherente a que el campo es opcional, decidir si vale la pena resolverlo (¿crear el ítem de inventario al vuelo?).

## Integración
- [ ] Webhook/Server Action que registre automáticamente en `orders` cada venta hecha desde el ecommerce.
- [ ] Publicar diseño desde admin → visible en catálogo web (toggle `published_to_ecommerce`).
- [ ] Notificaciones por email (Resend): confirmación de pedido, alertas de cuentas por pagar próximas a vencer.

## Infraestructura
- [ ] Conectar repo a Vercel (dos proyectos: web y admin, o un proyecto con dos apps).
- [ ] Variables de entorno en Vercel (Supabase, Resend, pasarela de pago, WhatsApp) — mismos valores que en los `.env.local`.
- [x] Primer commit + push a GitHub hecho (2026-08-27).
