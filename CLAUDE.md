# CLAUDE.md — Ricamo

Este archivo orienta a Claude Code (y a cualquier colaborador) sobre el proyecto Ricamo: qué es el negocio, qué estamos construyendo, cómo está organizado el código y cómo trabajar aquí sesión tras sesión.

## 0. Memoria del proyecto (leer primero, siempre)

Este directorio tiene una bóveda de Obsidian en [`vault/Ricamo`](./vault/Ricamo) que funciona como memoria persistente del proyecto entre sesiones — es la fuente de verdad sobre "qué se ha hecho" y "qué falta", más actualizada que este archivo para ese propósito.

**Al empezar una sesión de trabajo en este proyecto:**
1. Leer `vault/Ricamo/02 Pendientes/Backlog.md` para saber qué está pendiente.
2. Leer la nota más reciente en `vault/Ricamo/01 Progreso/` (una nota por fecha, `YYYY-MM-DD.md`) para saber en qué quedó la última sesión.
3. Si hay dudas sobre una decisión ya tomada, revisar `vault/Ricamo/00 Contexto/Decisiones.md` antes de proponer algo distinto o de volver a preguntar algo ya resuelto.

**Al cerrar una sesión con cambios relevantes:**
1. Crear (o actualizar si ya existe) la nota de hoy en `vault/Ricamo/01 Progreso/YYYY-MM-DD.md`: qué se hizo, qué se decidió, qué quedó a medias.
2. Actualizar `vault/Ricamo/02 Pendientes/Backlog.md`: marcar lo resuelto, añadir lo nuevo que haya surgido.
3. Si se tomó una decisión de arquitectura o de negocio no trivial, registrarla en `vault/Ricamo/00 Contexto/Decisiones.md` con fecha y motivo (no editar entradas viejas, solo añadir).

No hace falta pedir permiso para escribir en la bóveda — es documentación del proyecto, no código de producción.

## 1. El negocio

**Ricamo** es una marca de bordados y estampados personalizados en camisetas y buzos, liderada por **Maria Jose Ruiz**. Maria Jose es además influencer: su imagen personal es el principal motor de ventas de la marca, por lo que la plataforma debe darle protagonismo como marca personal, no solo como "dueña de la tienda".

Detalle completo del negocio en [`vault/Ricamo/00 Contexto/Negocio.md`](./vault/Ricamo/00%20Contexto/Negocio.md). Resumen:

- El negocio **no tiene producción propia**. Trabaja con:
  - **Maquiladoras**: empresas externas que imprimen o bordan los diseños sobre las prendas.
  - **Proveedores de prendas**: empresas que venden las camisetas y buzos en blanco.
- Maria Jose maneja **dos técnicas**: bordado y estampado.
- **Instagram real: [@ricamo_col](https://www.instagram.com/ricamo_col/)** — 27,9 mil seguidores, base en **Medellín, con envíos a toda Colombia**. Prendas: camisetas y "hoodies" (= `buzo` en el modelo de datos). Líneas de producto visibles: camisetas de pareja personalizadas, diseños de orgullo regional/viajes (mapas estilo sello postal, colecciones por ciudad, flora/fauna colombiana), y piezas de humor/pop cultura — todas con ilustración fina de línea sobre prendas oversized en crudo/blanco. Detalle completo en `vault/Ricamo/00 Contexto/Negocio.md`.
- Flujo actual (100% manual, vía redes sociales + WhatsApp):
  1. Maria Jose publica en redes sociales.
  2. El cliente escribe por WhatsApp para cerrar el pedido.
  3. Si es personalizado, el cliente describe lo que quiere.
  4. Maria Jose diseña y envía el diseño al cliente para aprobación.
  5. Con el diseño aprobado, lo envía a la maquiladora para producción.
  6. La maquiladora entrega el producto terminado.
- La plataforma digitaliza y conecta este flujo sin quitarle a Maria Jose el control creativo (ella sigue diseñando y aprobando con el cliente).

## 2. Qué estamos construyendo

Dos productos integrados sobre el mismo backend (Supabase):

1. **Ecommerce (`apps/web`)**: sitio público. Catálogo de productos de stock con pago en línea, cotizador de personalizados que termina en WhatsApp, y una sección de marca personal de Maria Jose.
2. **App de administración (`apps/admin`)**: panel privado para la gestión integral del negocio — ventas, compras, inventario, cuentas por cobrar/pagar, bancos, proveedores, domiciliarios y el banco de diseños.

**Integración entre ambos** (el punto más importante del proyecto):
- Toda venta hecha en el ecommerce (catálogo o personalizado) se registra **automáticamente** como `order` en Supabase — la app admin la ve sin trabajo manual.
- Un diseño cargado en la app admin se puede **publicar al ecommerce** con un toggle (`published_to_ecommerce`), sin tocar código ni reprocesos.

## 3. Decisiones tomadas

Registro completo con fechas y motivos en [`vault/Ricamo/00 Contexto/Decisiones.md`](./vault/Ricamo/00%20Contexto/Decisiones.md). Resumen de las decisiones fundacionales (2026-08-27):

| Decisión | Elegido | Motivo breve |
|---|---|---|
| Checkout | **Híbrido**: catálogo con pago en línea, personalizados siempre por cotización web → WhatsApp | El precio/diseño de lo personalizado se define en la conversación con Maria Jose, no se puede cobrar de antemano |
| App admin | **Web app responsive** (no nativa, por ahora) | Más rápido de construir y mantener con Vercel + Supabase; accesible desde el celular por navegador |
| Facturación | **Solo control interno**, sin DIAN por ahora | El negocio no está (todavía) obligado a facturación electrónica; se revisará con un contador más adelante |
| Estructura de código | **Monorepo** (`apps/web`, `apps/admin`, `packages/*`) | Comparte tipos, cliente de Supabase y tokens de marca entre las dos apps; encaja con la integración estrecha que pide el negocio |

## 4. Arquitectura técnica

- **Código**: GitHub (monorepo) — [`ricamocolombia/RicamoCol`](https://github.com/ricamocolombia/RicamoCol), rama `main`. Primer commit ya empujado (2026-08-27).
- **Base de datos / Auth / Storage**: Supabase (Postgres) — proyecto real conectado vía `.env.local` en ambas apps (no versionado). Esquema en [`supabase/migrations/0001_init.sql`](./supabase/migrations/0001_init.sql), **ya aplicado** al proyecto real (pegado a mano en el SQL Editor del Dashboard el 2026-08-27; el CLI `supabase link` sigue sin poder usarse porque falta un personal access token o la contraseña de la base de datos). `apps/admin` ya usa Supabase Auth para el login — ver sección 6.
  - [`0002_grants.sql`](./supabase/migrations/0002_grants.sql) y [`0003_crm.sql`](./supabase/migrations/0003_crm.sql) ya aplicadas (grants de Postgres + `customers.city`/`marketing_campaigns`).
  - [`0004_ventas_completas.sql`](./supabase/migrations/0004_ventas_completas.sql), [`0005_precios_estampado.sql`](./supabase/migrations/0005_precios_estampado.sql) y [`0006_bodegas.sql`](./supabase/migrations/0006_bodegas.sql) ya aplicadas y verificadas en vivo (2026-08-28).
  - [`0007_pagos_produccion.sql`](./supabase/migrations/0007_pagos_produccion.sql) aplicada y verificada en vivo (2026-08-28) — agrega `accounts_payable.order_id` y las claves de `app_settings` para los proveedores de producción.
  - [`0008_disenos_storage.sql`](./supabase/migrations/0008_disenos_storage.sql) (bucket público `design-images` en Supabase Storage + tabla `design_images`, galería de imágenes por diseño), [`0009_catalogo_colecciones.sql`](./supabase/migrations/0009_catalogo_colecciones.sql) (`collections` + `products.collection_id`/`is_featured`/`is_bestseller`) y [`0010_regalos.sql`](./supabase/migrations/0010_regalos.sql) (`gift_segments` + `product_gift_segments`, muchos-a-muchos, para la sección `/regalos`) aplicadas y verificadas en vivo con Playwright (2026-09-01) — ver sección 6 ("Carga de imágenes y catálogo curado").
  - `packages/supabase/src/types.ts` ya NO es un placeholder: tiene el `Database` completo escrito a mano a partir de las migraciones aplicadas, sin `as any`/`as never` en el código del admin. **Recordatorio**: toda migración nueva que cambie el esquema debe reflejarse también aquí a mano (no hay CLI todavía). Si en algún momento se consigue el access token de Supabase, se puede regenerar con `supabase gen types typescript` y comparar contra este archivo.
- **Despliegue**: Vercel, **dos proyectos separados** (uno por app, cada uno con su propio "Root Directory"): `@ricamo/admin` y `@ricamo/web`. El primer deploy de `@ricamo/admin` falló por build estático + variables de entorno faltantes, corregido el 2026-08-27 (todas las páginas de datos del admin ahora usan `export const dynamic = "force-dynamic"` — ver sección 10). El proyecto de `@ricamo/web` se creó el 2026-08-29 con el mismo bloqueo por variables de entorno faltantes, mismo fix. **Dominio propio**: `ricamocol.com` (comprado 2026-08-29) apunta al proyecto de `@ricamo/web` — el admin sigue en su URL de Vercel por defecto (o un subdominio propio si se decide más adelante), nunca en el dominio público.
  - **Vercel Cron** (`apps/admin/vercel.json`) llama `/api/cron/stock-alerts` todas las noches (04:00 UTC = 11pm Colombia) para las alertas de inventario bajo. Requiere la variable `CRON_SECRET` en Vercel (falta configurarla) — sin ella el endpoint rechaza toda llamada. Esa ruta está excluida del middleware de auth (`apps/admin/middleware.ts`) porque Vercel Cron no manda sesión de usuario.
- **Email transaccional**: Resend — `RESEND_API_KEY` configurada y dominio `ricamocol.com` verificado (2026-08-30), `RESEND_FROM_EMAIL` usa `@ricamocol.com` en ambas apps. Correos operacionales del ciclo de vida de un pedido y alertas de inventario ya construidos con marca y confirmados con un envío de prueba real — ver sección 6 ("Correos transaccionales con marca").
- **Frontend**: Next.js 15 (App Router) + TypeScript + Tailwind CSS en ambas apps.
- **Monorepo**: pnpm workspaces + Turborepo.

### Estructura de carpetas

```
apps/
  web/                  ecommerce (puerto 3000 en dev)
    components/           Header, Footer, ProductCard, MariaJoseSpotlight, WhatsAppFloatingButton (no son rutas)
    lib/                   format.ts (moneda/labels), whatsapp.ts (link con mensaje prellenado), catalog.ts (resuelve imagen/coleccion/insignia de un producto, compartido entre paginas)
    app/
      page.tsx           home: hero, tiles tecnica, colecciones, destacados (curados + relleno reciente), mas vendidos, como-funciona, Maria Jose
      catalogo/           grid real filtrable (tecnica/prenda/coleccion) + [slug]/ detalle de producto con galeria
      regalos/            ideas de regalo agrupadas por segmento (para parejas/familiares/amigos, administrable)
      personalizados/     formulario real -> crea customer + design_request -> WhatsApp
      sobre-maria-jose/   pagina de marca personal (historia + CTA)
      not-found.tsx       404 con identidad de marca
      api/orders/         endpoint que registra ventas del ecommerce en Supabase (aun TODO, depende de pasarela de pago)
  admin/                gestion del negocio (puerto 3001 en dev)
    components/            AppShell (sidebar), icons.tsx, navItems.ts, ImageDropzone, dashboard/* (no son rutas)
    lib/                   metrics.ts, storage.ts (subida a Supabase Storage), orderEmails.ts, stockAlerts.ts (no son rutas)
    app/
      page.tsx            dashboard con metricas reales del negocio, graficos y accesos a cada modulo
      ventas/
      clientes/            CRM: segmento de recompra, ficha con historial de pedidos
      campanas/            campañas de marketing por email (Resend), segmentadas
      compras/
      inventario/
      cuentas-por-cobrar/
      cuentas-por-pagar/
      bancos/
      proveedores/
      domiciliarios/
      disenos/            banco de disenos con galeria de imagenes; [id]/publicar crea el `product` de catalogo (solo si esta aprobado)
      catalogo/            que se ve en la web: coleccion/destacado/mas vendido/publicado por producto
      catalogo/colecciones/  CRUD de colecciones tematicas
      catalogo/regalos/      CRUD de segmentos de regalo (para quien es)
      login/
packages/
  ui/                   tokens de marca + plantillas de correo (email.ts) compartidos entre apps
  supabase/             clientes de Supabase: browser, server (SSR), service role
supabase/
  migrations/           esquema SQL versionado
  config.toml            config del proyecto Supabase (CLI)
vault/
  Ricamo/                boveda de Obsidian: memoria del proyecto (ver seccion 0)
```

## 5. Modelo de datos

Esquema completo y comentado en [`supabase/migrations/0001_init.sql`](./supabase/migrations/0001_init.sql). Tablas principales, agrupadas por área:

- **Clientes / CRM**: `customers` (incluye `city`, agregada en `0003_crm.sql`), `marketing_campaigns` (campañas de email por segmento, también en `0003_crm.sql`).
- **Catálogo / diseños**: `designs` (banco de diseños de Maria Jose, con estado y flag `published_to_ecommerce`), `design_images` (galería de imágenes por diseño, con `is_cover`; `0008_disenos_storage.sql`), `design_requests` (solicitudes de personalizado desde la web, previas a WhatsApp), `products` + `product_variants` (catálogo de stock; `products` tiene `collection_id`/`is_featured`/`is_bestseller` desde `0009_catalogo_colecciones.sql`), `collections` (colecciones temáticas curadas por el admin, una por producto), `gift_segments` + `product_gift_segments` (segmentos de "para quién es el regalo" — parejas/familiares/amigos y los que se agreguen —, muchos-a-muchos: un producto puede estar en varios a la vez; `0010_regalos.sql`).
- **Ventas**: `orders` (con `source`: `web_catalogo` / `web_personalizado` / `whatsapp` / `manual`; `shipping_type`/`shipping_payment_status` agregados en `0004_ventas_completas.sql`), `order_items` (tipo de prenda/categoría/color/talla como texto libre, técnica, `cost_cop` — el costo total de decoración de ese ítem, para rentabilidad — también `0004`), `order_item_decorations` (una fila por cada estampado/bordado del ítem, con su propio `print_size` opcional y `cost_cop`; `order_items.cost_cop` es la suma de estas filas desde `0011_lineas_decoracion.sql` — `order_items.print_size`, el campo viejo de un solo tamaño, ya no se usa para ventas nuevas), `deliveries`.
- **Bodegas / inventario**: `warehouses` (bodegas — cantidad abierta, CRUD propio, `0006_bodegas.sql`), `inventory_items` (prendas en blanco, por bodega vía `warehouse_id`; `garment_type` es texto libre desde `0006`, no un enum), `inventory_movements`.
- **Compras**: `suppliers` (tipo: `maquiladora` / `prendas` / `insumos` / `otro`), `purchases` (con `invoice_number`, `0006`), `purchase_items`.
- **Finanzas**: `bank_accounts`, `transactions` (ingresos/salidas), `accounts_receivable`, `accounts_payable` (con `order_id`, `0007_pagos_produccion.sql` — deudas a los proveedores de producción cargadas automáticamente desde Ventas), `print_size_prices` (costos de referencia de estampado, editables desde `apps/admin/configuracion` — `0005_precios_estampado.sql`).
- **Logística**: `couriers` (domiciliarios).
- **Configuración**: `app_settings` (clave/valor genérico — hoy solo el correo de alertas de inventario, `0006_bodegas.sql`).

**Seguridad (RLS)**: todas las tablas tienen Row Level Security habilitado. Por defecto, todo está bloqueado para los roles `anon`/`authenticated`; el backend de ambas apps opera con la `service_role` key desde el servidor (Server Actions / route handlers), que ignora RLS. Las únicas excepciones son lecturas públicas explícitas de `products`, `product_variants` y `designs` cuando están publicados — es lo que necesita el ecommerce de cara al cliente. Ver la política final en el `.sql` antes de dar por cerrado este punto (está marcado como pendiente en el backlog).

## 6. Flujos clave

**Venta de catálogo (hoy vía WhatsApp, pago en línea pendiente):**
Cliente navega `/catalogo` (grid real, filtrable por técnica/tipo de prenda) → entra a `/catalogo/[slug]` → botón "Pedir por WhatsApp" abre un chat con el nombre/precio/tallas del producto prellenado → Maria Jose cierra la venta por WhatsApp como hoy → la registra manualmente en `apps/admin/ventas`. Cuando exista pasarela de pago, ese botón se reemplaza por un checkout real que llame `POST /api/orders` (hoy un stub) para crear `order` (`source = web_catalogo`) + `order_items` + `transaction` automáticamente.

**Venta personalizada (cotización → WhatsApp):**
Cliente completa el formulario real en `/personalizados` (datos de contacto, prenda, técnica, talla, cantidad, referencia) → la Server Action busca/crea el `customer` por teléfono y crea un `design_request` en Supabase (queda visible para el admin) → `redirect()` externo directo a WhatsApp con el resumen prellenado → el cliente continúa la conversación con Maria Jose como hoy → cuando ella cierra el trato, registra manualmente la venta en `apps/admin/ventas` (o se convierte el `design_request` en `order` desde el admin).

**Registro manual de una venta (`apps/admin/ventas/nueva`):**
Captura cliente (existente o nuevo, con cédula/dirección/ciudad/barrio), el ítem vendido (descripción, tipo de prenda/categoría/color/talla como texto libre con sugerencias vía `<datalist>` que crecen solas, cantidad, precio de venta), técnica y costo de producción, pago (banco + monto recibido + abono/pago total) y envío (nacional/local, contraentrega/pagado, domiciliario). El costo de producción admite **varias líneas de decoración** (`components/DecorationLinesField.tsx`, cliente component con botón "+ Agregar otra decoración") — una prenda puede llevar más de un estampado/bordado (ej. punto corazón adelante + carta atrás), cada línea con su propio tamaño de referencia (opcional, precios conocidos solo para "punto corazón" y "media carta", el resto pendiente de confirmar con el negocio) y costo manual; el total (`order_items.cost_cop`) se suma automáticamente en el servidor y cada línea queda guardada en `order_item_decorations` para el desglose. Si se recibió dinero, se crea automáticamente la `transaction` de ingreso en Bancos; si lo recibido queda por debajo del total, se crea también la `accounts_receivable` del saldo pendiente — el saldo se deriva (total − recibido), nunca se le pide al usuario que lo calcule. Soporta un solo ítem por venta por ahora (ver backlog). La carga automática de ventas hechas en el ecommerce todavía no existe — depende del catálogo y la pasarela de pago, ninguno construido — pero `order_items` ya tiene los mismos campos que usará ese flujo cuando se construya.

**Publicación de un diseño al ecommerce (solo si el administrador lo aprueba):**
Un diseño solo puede convertirse en producto vendible cuando su `status` es `aprobado` o `enviado_maquiladora` — nunca automático. Desde `apps/admin/disenos`, el administrador entra a `/disenos/[id]/publicar` (validado también en el servidor, no solo oculto en la UI) y llena nombre, tipo de prenda, precio y la primera talla → se crea el `product` (con `design_id`) + su `product_variant`, `products.is_published = true` y se sincroniza `designs.published_to_ecommerce`. Después de creado, publicar/despublicar y toda la curación (colección, destacado, más vendido) se maneja desde `apps/admin/catalogo`, no desde Diseños — ver "Carga de imágenes y catálogo curado" más abajo.

**Carga de imágenes y catálogo curado (`apps/admin/disenos` + `apps/admin/catalogo`):**
Cada diseño puede tener varias imágenes (`design_images`), subidas con un cajón de arrastrar-y-soltar (`components/ImageDropzone.tsx`, con vista previa local por JS de cliente, pero el envío real es un `<form>` normal a la Server Action — funciona igual sin JS) que sube a Supabase Storage (bucket público `design-images`) vía `apps/admin/lib/storage.ts`. Una imagen se marca como portada (`is_cover`) y es la que se usa como miniatura en Diseños, Catálogo y el ecommerce; `designs.image_url` (el campo de texto viejo) queda como respaldo solo para diseños creados antes de esto. `apps/admin/catalogo` es donde se decide qué se ve en la web: cada producto tiene un formulario inline para asignar colección (`apps/admin/catalogo/colecciones`, CRUD simple con imagen de portada), marcar "Destacado"/"Más vendido", y publicar/despublicar. En el ecommerce, `apps/web/lib/catalog.ts` centraliza cómo se resuelve la imagen de portada/colección/insignia de cada producto para el home y `/catalogo`; "Destacados" se rellena con los productos más recientes si el admin no ha marcado suficientes, "Más vendidos" es un interruptor manual (calcularlo de ventas reales requeriría exponer un conteo agregado sin filtrar datos de pedidos a `anon`, ver backlog), y "Nuevo" se deriva solo de `created_at` (últimos 30 días), sin campo manual. Aparte de colecciones (una por producto), existen **segmentos de regalo** (`gift_segments`/`product_gift_segments`, muchos-a-muchos — administrables en `apps/admin/catalogo/regalos`, un producto puede estar en varios a la vez) que alimentan la página pública `/regalos`, con una sección por segmento activo.

**Ciclo de producción de un pedido, edición y timeline (`apps/admin/ventas/[id]`):**
Diseño aprobado por el cliente → `orders.status` avanza por el timeline `pendiente → confirmado → en_produccion → enviado → entregado` (fuera del sistema, la maquiladora recibe el diseño y produce, por ahora manual). Desde `/ventas/[id]` el administrador ve el detalle completo del pedido y tiene un botón por cada transición válida hacia adelante (mismo patrón `FORWARD_ACTION` que Diseños), más "Cancelar pedido" (desde cualquier estado no terminal) y "Reactivar" (desde cancelado, vuelve a pendiente). `/ventas/[id]/editar` permite editar campos a nivel de pedido (estado de pago, método, domiciliario, tipo de envío, notas) — nunca los `order_items`, porque esos ya pudieron generar `transactions`/`accounts_payable`/`accounts_receivable` con montos fijos. Cancelar un pedido **no revierte automáticamente** esos movimientos financieros ya creados — hay que ajustarlos a mano en Bancos/Cuentas por cobrar/pagar. Cada transición hacia adelante (y a cancelado) dispara un correo al cliente si tiene email — ver "Correos transaccionales" abajo.

**Login del panel admin:**
`apps/admin/middleware.ts` protege todas las rutas con Supabase Auth: sin sesión, redirige a `/login`; con sesión, `/login` redirige a `/`. No hay auto-registro — las cuentas se crean con `pnpm create-admin-user <email> <password>` (usa la `service_role` key vía `scripts/create-admin-user.mjs`, crea el usuario ya confirmado). Logout es un botón en el dashboard (`app/page.tsx`) que llama a la Server Action `signOut` de `app/login/actions.ts`.

**Segmentación de clientes y campañas de marketing:**
`apps/admin/lib/metrics.ts` clasifica cada cliente en `sin_compras` / `nuevo` / `recurrente` / `inactivo` (más de 90 días sin comprar) a partir de su historial en `orders` — se calcula en memoria, no hay columna ni vista en la base de datos para esto. `apps/admin/campanas` usa la misma clasificación para segmentar el envío: una campaña en borrador se manda por correo (Resend) a todos los clientes con email cuyo segmento calce, de forma secuencial (tope de 500 destinatarios).

**Compra de prendas → inventario de una bodega:**
En `apps/admin/compras/nueva`, si se indica bodega + tipo de prenda (+ color/talla opcionales, campos abiertos con `<datalist>`), la Server Action busca un `inventory_item` que ya exista para esa combinación exacta en esa bodega; si no existe, lo crea (con `reorder_level = 2` por defecto). Si la compra ya está "recibida", suma el stock ahí mismo y deja un `inventory_movement`. Sin bodega + tipo de prenda, la compra queda como descripción libre sin tocar inventario (para insumos u otras compras que no son prenda de bodega).

**Cuenta por pagar automática al proveedor de producción:**
Si una venta trae técnica (bordado/estampado) y costo de decoración, `apps/admin/ventas/nueva/actions.ts` resuelve el proveedor configurado para esa técnica (`app_settings.supplier_estampado_id`/`supplier_bordado_id`, definidos en `/configuracion`) y crea una `accounts_payable` por `cost_cop × cantidad`, con `order_id` apuntando a la venta. Sin proveedor configurado para esa técnica, se omite en silencio (la venta se registra igual). En `/cuentas-por-pagar`, las pendientes se agrupan por proveedor con selección múltiple: al confirmar el pago (banco + monto), se marcan todas las seleccionadas como pagadas y se registra una sola salida en Bancos.

**Alertas nocturnas de stock bajo:**
`apps/admin/lib/stockAlerts.ts` revisa `inventory_items` donde `quantity_on_hand <= reorder_level` y `alert_enabled = true`, agrupa por bodega, y manda un correo (Resend) al destinatario configurado en `/configuracion`. Se dispara desde Vercel Cron (`apps/admin/vercel.json`, `/api/cron/stock-alerts`, protegido con `CRON_SECRET`) todas las noches, o manualmente desde el botón "Enviar alerta por correo ahora" en `/inventario`. El umbral (nivel mínimo) y el on/off de la alerta son por ítem — editables sin tocar código; el horario del cron sí requiere editar `vercel.json` y redesplegar.

**Correos transaccionales con marca (Resend):**
`packages/ui/src/email.ts` (exportado desde `@ricamo/ui`, compartido entre ambas apps) tiene las plantillas HTML con estilos inline (header negro + logo amarillo servido desde `https://ricamocol.com`, tarjeta blanca, pie hueso) — no usan CSS externo porque muchos clientes de correo lo ignoran. `buildOrderStatusEmail({ kind, ... })` cubre todo el ciclo de vida de un pedido (`creado`/`confirmado`/`en_produccion`/`enviado`/`entregado`/`cancelado`) con un solo template parametrizado; `buildStockAlertEmail(...)` es la versión con marca del correo de inventario bajo. `apps/admin/lib/orderEmails.ts` (`sendOrderStatusEmail(orderId, kind)`) resuelve cliente/ítems/domiciliario y envía — nunca lanza (si falla, el pedido/venta ya se guardó con éxito antes de intentar el correo, así que un correo fallido no debe tumbar la Server Action). Se dispara desde `ventas/nueva/actions.ts` (al crear, `kind: "creado"`) y desde `ventas/[id]/actions.ts` (`updateOrderStatus`, en cada transición hacia adelante y a `cancelado`; la reactivación a `pendiente` no genera correo, es una corrección interna). Si el cliente no tiene correo registrado, se omite en silencio.

**Dashboard del negocio:**
`apps/admin/app/page.tsx` calcula en memoria (sin vistas SQL) las métricas clave a partir de `orders`, `order_items`, `transactions`, `customers`, `accounts_receivable/payable` e `inventory_items`: ventas, ingresos/salidas de bancos, % de recompra, cuentas pendientes, top ciudades/clientes, ventas por origen, gastos por categoría, y **rentabilidad bruta/margen bruto** (precio de venta menos `order_items.cost_cop`, solo sobre ítems con costo ya registrado). Acepta un filtro opcional de periodo por query params (`?desde=YYYY-MM-DD&hasta=YYYY-MM-DD`, formulario GET sin JavaScript) que filtra ventas, transacciones e ítems a la vez; sin el filtro se ve todo el histórico.

## 7. Identidad de marca

- Logo recibido el 2026-08-27: isotipo de una carita feliz dibujada a mano + wordmark "Ricamo", con el tagline **"Lo creas, lo llevas"**. Hay dos versiones: fondo negro con logo amarillo, y fondo amarillo con logo negro (útiles para contraste según el fondo).
- Colores de marca: **amarillo, negro y rojo**. No existe un manual de marca formal — el amarillo (`#F5C518`) y el negro (`#0A0A0A`) en `packages/ui/src/tokens.ts` y en los `tailwind.config.ts` de cada app se tomaron a ojo del logo y quedan como el estándar de facto del proyecto. El rojo (`#D7263D`) sigue siendo un acento provisional: no aparece en el isotipo, está pensado como color de refuerzo (CTAs, badges) y falta definirlo con el negocio.
- Archivos del logo ya están en el repo (`apps/web/public/brand/` y `apps/admin/public/brand/`, ver el `LEEME.md` de cada carpeta) y conectados: `logo-transparente-negro.png` en el header de ambas apps (`app/layout.tsx`), `logo-fondo-amarillo.png` como favicon (`app/icon.png`) de ambas apps.
- **Tipografía** (definida 2026-08-28, solo en `apps/web` — el ecommerce, no el admin): **Fredoka** para títulos + **Nunito** para cuerpo, cargadas vía `next/font/google` en `apps/web/app/layout.tsx`. Elegidas por redondas/amigables, hacen eco del isotipo dibujado a mano sin sentirse infantiles. `tailwind.config.ts` las expone como `font-display`/`font-sans`.
- **Paleta extendida** (`apps/web/tailwind.config.ts`): `ricamo-cream` (`#FAF6EC`) y `ricamo-bone` (`#F1EADA`) como fondo/superficie, para que combine con las prendas oversized en crudo/blanco que ya usa la marca en Instagram. Amarillo/negro/rojo del logo quedan como acentos (CTAs, badges), no como fondo.
- Maria Jose Ruiz es la cara visible de la marca — la home del ecommerce (sección "Destacados" + `MariaJoseSpotlight` compacto) y `/sobre-maria-jose` (versión completa) ya la muestran como marca personal. **Falta una foto real de ella** — hoy hay un placeholder de marca marcado con `TODO` en `apps/web/components/MariaJoseSpotlight.tsx`.

## 8. Pendientes / decisiones abiertas

Lista viva y detallada en [`vault/Ricamo/02 Pendientes/Backlog.md`](./vault/Ricamo/02%20Pendientes/Backlog.md). Los bloqueos más importantes que dependen del usuario:

- Costos de estampado faltantes: "carta", "oficio" y "tabloide" (solo se conocen "punto corazón" = $5.000 y "media carta" = $7.000). Ya se pueden cargar sin tocar código desde `/configuracion` en cuanto el negocio los confirme. También confirmar si son realmente 5 tamaños o si el negocio dijo "4 opciones" por error.
- **Falta `CRON_SECRET` en Vercel** y el correo de alertas en `/configuracion` — sin esto las alertas nocturnas de inventario no se envían (ver sección 4/6).
- **Aplicar `supabase/migrations/0007_pagos_produccion.sql`** y configurar en `/configuracion` los proveedores de producción (estampado/bordado) — sin ambas cosas, las ventas con técnica no generan cuenta por pagar.
- Confirmar que las variables de entorno de Vercel quedaron completas (`SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL` como "Secret"/"Config" según corresponda) — el primer deploy falló por esto.
- Elegir pasarela de pago para Colombia (candidatas naturales: Wompi, MercadoPago, PayU).
- Cuenta de Resend creada, `RESEND_API_KEY` configurada (2026-08-29) — falta confirmar si el dominio de `RESEND_FROM_EMAIL` está verificado en Resend (necesario para que el envío real funcione de forma confiable).
- Contenido de marca personal de Maria Jose (bio, redes, fotos, historia) para `/sobre-maria-jose`, más allá de lo público en Instagram.
- Revisar con un contador si/cuándo el negocio necesitará facturación electrónica DIAN.

## 9. Roadmap por fases

1. **Fundación** (hecho el 2026-08-27): estructura del monorepo, esquema de base de datos inicial, `CLAUDE.md`, memoria del proyecto en Obsidian.
2. **Conexión de infraestructura** (hecho el 2026-08-27, falta Resend): proyecto real en Supabase conectado y con la migración aplicada, repo en GitHub con el primer push, `pnpm install`/`pnpm build` verificados en local.
3. **App admin — núcleo operativo** (construido y verificado en vivo el 2026-08-27): autenticación con Supabase Auth, los 9 módulos operativos (ventas, compras, inventario, cuentas por cobrar y pagar, bancos, proveedores, domiciliarios, diseños), más Clientes/CRM, Campañas de marketing, Dashboard con métricas reales, y la conexión Diseño→Producto con aprobación explícita del administrador. Pendiente de verificar en vivo lo último (falta aplicar `0003_crm.sql`). Falta: editar/eliminar registros existentes en varios módulos, líneas múltiples por venta/compra, gestión de usuarios del panel. Detalle completo en `vault/Ricamo/01 Progreso/2026-08-27.md` y en el backlog.
4. **Ecommerce — catálogo y marca personal** (construido y verificado en vivo el 2026-08-28): home, `/catalogo` + `/catalogo/[slug]`, `/personalizados` real, `/sobre-maria-jose` ampliada, identidad visual definitiva (logo + tipografía Fredoka/Nunito + paleta crudo/hueso). Falta: foto real de Maria Jose y fotografía de producto (placeholders marcados con `TODO`), pasarela de pago, y evaluar categorías/colecciones para el catálogo.
5. **Integración**: registro automático de ventas web → admin, publicación de diseños admin → ecommerce, checkout con pasarela de pagos para el catálogo.
6. **Pulido**: notificaciones por email (confirmaciones, alertas de cartera), SEO, despliegue final en Vercel con dominio propio.

## 10. Convenciones de desarrollo

- TypeScript estricto en todo el monorepo (`tsconfig.base.json`).
- Tailwind CSS para estilos; los colores de marca viven en `packages/ui/src/tokens.ts` — no hardcodear hex sueltos en componentes.
- Toda escritura a Supabase que requiera saltarse RLS (crear orden desde el ecommerce, operaciones del admin) se hace en el servidor (route handler / Server Action) con `createServiceRoleClient()` de `@ricamo/supabase` — nunca exponer la `service_role` key al cliente.
- Nombres de tablas y columnas en `snake_case`, en español para lo específico del dominio del negocio (`domiciliarios` → `couriers` en inglés técnico está bien si ya es un término universal, pero mantener el criterio usado en el `.sql` existente antes de mezclar convenciones).
- Antes de añadir una tabla o columna nueva, revisar si ya existe algo equivalente en `supabase/migrations/0001_init.sql` — extender con una migración nueva, no editar la ya aplicada si el proyecto ya está conectado a Supabase real.
- No commitear archivos `.env*` (ya están en `.gitignore`); usar los `.env.example` como referencia de qué variables existen.
- pnpm aísla las dependencias por paquete: un archivo dentro de `apps/web` o `apps/admin` solo puede importar paquetes listados en el `package.json` de esa app (o de un `packages/*` del que dependa), aunque el paquete ya esté instalado en otro lado del monorepo. Si `pnpm build` falla con "Cannot find module" para algo que sí está en el lockfile, casi siempre es esto — agregar la dependencia directa donde se usa (o exponerla desde el `package.json` de `packages/supabase` o `packages/ui` con un `exports` map) y correr `pnpm install` de nuevo. Ya pasó con `@supabase/ssr` en `apps/admin/middleware.ts` y con `next` (peerDependency) en `packages/supabase/src/server.ts`.
- **Toda página de `apps/admin` que consulte datos de negocio vía `createServiceRoleClient()` debe llevar `export const dynamic = "force-dynamic";`** justo antes del componente. Sin esto, Next puede decidir prerenderizarla como estática en el build — sirviendo datos congelados en producción, y además ejecutando la consulta a Supabase durante el build mismo (lo que rompió el primer deploy en Vercel por falta de env vars ahí). Aplica a toda página nueva del admin que muestre datos reales, no solo a las que ya lo tienen.
- Validar siempre en el servidor (Server Action), no solo ocultar en la UI, cualquier regla de negocio de "esto requiere aprobación" — ej. el flujo Diseño→Producto revisa `design.status` de nuevo dentro de la Server Action antes de crear el `product`, no confía en que el botón estuviera oculto.
- Al usar el patrón `function fail(message): never { redirect(...) }` para cortar una Server Action con un error, si `fail` necesita datos del closure (como un `id` de la URL) declararlo como función de módulo con esos datos como parámetro (`function fail(id, message): never {...}`), no como `const fail = () => {...}` definida dentro de la función — la segunda forma perdió el narrowing de TypeScript de variables validadas más abajo cuando había un `while`/loop de por medio (visto en `disenos/[id]/publicar/actions.ts`).
- El `content` de cada `tailwind.config.ts` (`apps/web` y `apps/admin`) debe incluir **toda** carpeta de componentes de esa app, no solo `./app/**/*.{ts,tsx}`. Al crear `apps/admin/components/` (rediseño del panel, 2026-08-29) el `content` seguía apuntando solo a `app/`, así que Tailwind nunca escaneó los componentes nuevos y no generó sus clases — el build compiló sin errores igual (esto no se detecta con `tsc`/`pnpm build`, solo se ve visualmente: iconos SVG a tamaño gigante/intrínseco, layout sin estilos). Verificar el `content` la primera vez que se crea una carpeta de componentes nueva fuera de `app/`.

## 11. Variables de entorno

Ver `apps/web/.env.example` y `apps/admin/.env.example` para el detalle completo. En resumen, ambas apps necesitan Supabase (URL, anon key, service role key) y Resend (`RESEND_API_KEY`/`RESEND_FROM_EMAIL`, ya configuradas); el ecommerce además necesita el número de WhatsApp (`NEXT_PUBLIC_WHATSAPP_NUMBER=573216245987`, confirmado por el negocio) y las credenciales de la pasarela de pagos (aún sin definir).

## 12. Notas para Claude Code en este repo

- El ecommerce (`apps/web`) ya tiene home, catálogo, detalle de producto, personalizados y sobre-maria-jose con lógica real (2026-08-28) — ya no es scaffold. Lo que sigue siendo placeholder a propósito: las fotos (marca) y el checkout con pago en línea (WhatsApp por ahora). El admin (`apps/admin`) tiene 12 módulos con lógica real (ver sección 9). Antes de "arreglar" algo, confirmar si es un placeholder intencional documentado aquí (o marcado `TODO` en el código) o un bug real.
- `pnpm install` y `pnpm build` ya se verificaron (2026-08-27) — ambas apps compilan. Si algo no compila después de un cambio, es una regresión real, no un problema preexistente del scaffold.
- Git está inicializado, con `origin` en GitHub (`ricamocolombia/RicamoCol`) y el primer commit ya empujado a `main` (2026-08-27). No commitear ni hacer push sin que el usuario lo pida explícitamente en esa sesión — es una instrucción general del entorno, no específica de este proyecto, pero aplica con fuerza aquí porque el remoto ya es real.
- Los archivos `.env.local` de ambas apps tienen credenciales reales de Supabase (incluida la `service_role` key). Nunca imprimirlas en la bóveda de Obsidian, en `CLAUDE.md` ni en ningún archivo que se vaya a commitear — viven solo en `.env.local` (gitignored).
- **Si toca dividir trabajo en agentes en paralelo dentro de este repo** (como se hizo el 2026-08-27 para el módulo admin): asignar carpetas disjuntas a cada agente, prohibirles tocar `package.json`/`layout.tsx`/`middleware.ts`/archivos compartidos, prohibirles `pnpm install` y builds completos (chocan entre sí), prohibirles git — y hacer la integración (typecheck completo, remover workarounds de tipos, build final, commit) tú mismo al final, no delegarla.
- Un permission denied (`42501`) de Postgres al leer/escribir cualquier tabla nueva casi siempre significa que faltó el `GRANT` correspondiente, no que RLS esté mal — ver `0002_grants.sql` y su `ALTER DEFAULT PRIVILEGES`, que ya cubre las tablas futuras si se sigue aplicando cada migración en orden.
- Sigue el proceso de la sección 0 (leer/escribir en la bóveda de Obsidian) en cada sesión para que el contexto no se pierda entre conversaciones.
- **Hay un MCP de Playwright instalado a nivel de usuario** (`playwright-mcp` en `IA JUAN CAMILO/playwright-mcp`, fuera de este repo) — si sus herramientas (`mcp__playwright__*`) aparecen disponibles en la sesión, úsalas para verificar visualmente cambios de UI en vivo (levantar `pnpm dev` de la app correspondiente, navegar, tomar captura) en vez de solo confiar en `pnpm build`/pedirle capturas al usuario. Si no aparecen, es porque la sesión no se ha reiniciado desde que se instaló — avisa que hace falta reiniciar en vez de asumir que no existe.
