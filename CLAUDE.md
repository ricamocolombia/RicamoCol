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
  - **⚠️ [`supabase/migrations/0002_grants.sql`](./supabase/migrations/0002_grants.sql) todavía NO está aplicada.** Sin ella, ningún rol (ni siquiera `service_role`) puede leer/escribir ninguna tabla — Postgres exige `GRANT` de tabla además de RLS, y `0001_init.sql` nunca lo otorgó. Mientras esto no se aplique, todo el módulo admin (sección 6) está sin verificar en vivo. Ver [`vault/Ricamo/02 Pendientes/Backlog.md`](./vault/Ricamo/02%20Pendientes/Backlog.md).
  - `packages/supabase/src/types.ts` ya NO es un placeholder: tiene el `Database` completo escrito a mano a partir del `.sql` (2026-08-27), sin `as any`/`as never` en el código del admin. Si en algún momento se consigue el access token de Supabase, se puede regenerar con `supabase gen types typescript` y comparar contra este archivo.
- **Despliegue**: Vercel — dos proyectos de Vercel apuntando al mismo repo (`apps/web` y `apps/admin` como root directory de cada uno), o un solo proyecto con dos apps si se prefiere; pendiente de definir al momento de conectar Vercel.
- **Email transaccional**: Resend (confirmación de pedidos, alertas de cuentas por pagar próximas a vencer, etc.).
- **Frontend**: Next.js 15 (App Router) + TypeScript + Tailwind CSS en ambas apps.
- **Monorepo**: pnpm workspaces + Turborepo.

### Estructura de carpetas

```
apps/
  web/                  ecommerce (puerto 3000 en dev)
    app/
      page.tsx           home (marca personal + accesos a catalogo/personalizados)
      catalogo/           listado de productos de stock
      personalizados/     cotizador -> WhatsApp
      sobre-maria-jose/   pagina de marca personal
      api/orders/         endpoint que registra ventas del ecommerce en Supabase
  admin/                gestion del negocio (puerto 3001 en dev)
    app/
      page.tsx            dashboard / accesos a cada modulo
      ventas/
      compras/
      inventario/
      cuentas-por-cobrar/
      cuentas-por-pagar/
      bancos/
      proveedores/
      domiciliarios/
      disenos/            banco de disenos + boton "Publicar en ecommerce"
packages/
  ui/                   tokens de marca (colores) compartidos entre apps
  supabase/             clientes de Supabase: browser, server (SSR), service role
supabase/
  migrations/           esquema SQL versionado
  config.toml            config del proyecto Supabase (CLI)
vault/
  Ricamo/                boveda de Obsidian: memoria del proyecto (ver seccion 0)
```

## 5. Modelo de datos

Esquema completo y comentado en [`supabase/migrations/0001_init.sql`](./supabase/migrations/0001_init.sql). Tablas principales, agrupadas por área:

- **Clientes**: `customers`.
- **Catálogo / diseños**: `designs` (banco de diseños de Maria Jose, con estado y flag `published_to_ecommerce`), `design_requests` (solicitudes de personalizado desde la web, previas a WhatsApp), `products` + `product_variants` (catálogo de stock).
- **Ventas**: `orders` (con `source`: `web_catalogo` / `web_personalizado` / `whatsapp` / `manual`), `order_items`, `deliveries`.
- **Inventario**: `inventory_items` (prendas en blanco), `inventory_movements`.
- **Compras**: `suppliers` (tipo: `maquiladora` / `prendas` / `insumos` / `otro`), `purchases`, `purchase_items`.
- **Finanzas**: `bank_accounts`, `transactions` (ingresos/salidas), `accounts_receivable`, `accounts_payable`.
- **Logística**: `couriers` (domiciliarios).

**Seguridad (RLS)**: todas las tablas tienen Row Level Security habilitado. Por defecto, todo está bloqueado para los roles `anon`/`authenticated`; el backend de ambas apps opera con la `service_role` key desde el servidor (Server Actions / route handlers), que ignora RLS. Las únicas excepciones son lecturas públicas explícitas de `products`, `product_variants` y `designs` cuando están publicados — es lo que necesita el ecommerce de cara al cliente. Ver la política final en el `.sql` antes de dar por cerrado este punto (está marcado como pendiente en el backlog).

## 6. Flujos clave

**Venta de catálogo (con pago en línea):**
Cliente navega `/catalogo` → agrega producto → checkout con la pasarela de pagos → `POST /api/orders` crea `order` (`source = web_catalogo`) + `order_items` + `transaction` de ingreso → Resend envía confirmación → visible de inmediato en `apps/admin/ventas`.

**Venta personalizada (cotización → WhatsApp):**
Cliente completa el formulario en `/personalizados` (prenda, técnica, talla, cantidad, referencia) → se crea un `design_request` → se genera un link de WhatsApp con el resumen prellenado → el cliente continúa la conversación con Maria Jose como hoy → cuando ella cierra el trato, registra manualmente la venta en `apps/admin/ventas` (o se convierte el `design_request` en `order` desde el admin).

**Publicación de un diseño al ecommerce:**
Maria Jose sube o marca un diseño como `aprobado` en `apps/admin/disenos` → si quiere venderlo como producto de catálogo, lo asocia a un `product` y activa "Publicar en ecommerce" → `published_to_ecommerce = true` (o `products.is_published = true`) → aparece de inmediato en `/catalogo` del ecommerce sin deploy ni intervención de código.

**Ciclo de producción de un pedido:**
Diseño aprobado por el cliente → `orders.status` pasa a `en_produccion` → se envía a la maquiladora (fuera del sistema, por ahora manual) → al recibir el producto terminado, `status` pasa a `enviado`/`entregado` y se coordina con un `courier` en `deliveries`.

**Login del panel admin:**
`apps/admin/middleware.ts` protege todas las rutas con Supabase Auth: sin sesión, redirige a `/login`; con sesión, `/login` redirige a `/`. No hay auto-registro — las cuentas se crean con `pnpm create-admin-user <email> <password>` (usa la `service_role` key vía `scripts/create-admin-user.mjs`, crea el usuario ya confirmado). Logout es un botón en el dashboard (`app/page.tsx`) que llama a la Server Action `signOut` de `app/login/actions.ts`.

## 7. Identidad de marca

- Logo recibido el 2026-08-27: isotipo de una carita feliz dibujada a mano + wordmark "Ricamo", con el tagline **"Lo creas, lo llevas"**. Hay dos versiones: fondo negro con logo amarillo, y fondo amarillo con logo negro (útiles para contraste según el fondo).
- Colores de marca: **amarillo, negro y rojo**. No existe un manual de marca formal — el amarillo (`#F5C518`) y el negro (`#0A0A0A`) en `packages/ui/src/tokens.ts` y en los `tailwind.config.ts` de cada app se tomaron a ojo del logo y quedan como el estándar de facto del proyecto. El rojo (`#D7263D`) sigue siendo un acento provisional: no aparece en el isotipo, está pensado como color de refuerzo (CTAs, badges) y falta definirlo con el negocio.
- Archivos del logo ya están en el repo (`apps/web/public/brand/` y `apps/admin/public/brand/`, ver el `LEEME.md` de cada carpeta) y conectados: `logo-transparente-negro.png` en el header de ambas apps (`app/layout.tsx`), `logo-fondo-amarillo.png` como favicon (`app/icon.png`) de ambas apps.
- Maria Jose Ruiz es la cara visible de la marca. La home del ecommerce y la página `/sobre-maria-jose` deben construirse pensando en marca personal (bio, redes sociales, historia, fotos), no solo como una tienda genérica.

## 8. Pendientes / decisiones abiertas

Lista viva y detallada en [`vault/Ricamo/02 Pendientes/Backlog.md`](./vault/Ricamo/02%20Pendientes/Backlog.md). Los bloqueos más importantes que dependen del usuario:

- **Aplicar `supabase/migrations/0002_grants.sql`** en el SQL Editor del Dashboard de Supabase — sin esto el módulo admin no se puede probar en vivo (ver sección 4).
- Confirmar si el WhatsApp del negocio para la web es 3216245987 (+57), visto en el Instagram.
- Elegir pasarela de pago para Colombia (candidatas naturales: Wompi, MercadoPago, PayU).
- Dominio del sitio.
- Cuenta de Resend (API key + dominio verificado para enviar correos) — Supabase y GitHub ya están conectados.
- Contenido de marca personal de Maria Jose (bio, redes, fotos, historia) para `/sobre-maria-jose`, más allá de lo público en Instagram.
- Revisar con un contador si/cuándo el negocio necesitará facturación electrónica DIAN.

## 9. Roadmap por fases

1. **Fundación** (hecho el 2026-08-27): estructura del monorepo, esquema de base de datos inicial, `CLAUDE.md`, memoria del proyecto en Obsidian.
2. **Conexión de infraestructura** (hecho el 2026-08-27, falta Resend): proyecto real en Supabase conectado y con la migración aplicada, repo en GitHub con el primer push, `pnpm install`/`pnpm build` verificados en local.
3. **App admin — núcleo operativo** (construido el 2026-08-27, pendiente de verificar en vivo): autenticación con Supabase Auth, y los 9 módulos (ventas, compras, inventario, cuentas por cobrar y pagar, bancos, proveedores, domiciliarios, diseños) con listado real + alta conectados a Supabase — construidos con 4 agentes en paralelo, uno por área de negocio. Falta: aplicar `0002_grants.sql` para poder probarlo en vivo, editar/eliminar registros existentes, y un módulo de clientes dedicado (hoy Ventas lo resuelve inline). Detalle completo en `vault/Ricamo/01 Progreso/2026-08-27.md` y en el backlog.
4. **Ecommerce — catálogo y marca personal**: catálogo real conectado a Supabase, página de Maria Jose, identidad visual definitiva (logo).
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

## 11. Variables de entorno

Ver `apps/web/.env.example` y `apps/admin/.env.example` para el detalle completo. En resumen, ambas apps necesitan Supabase (URL, anon key, service role key); el ecommerce además necesita Resend, el número de WhatsApp de Maria Jose y las credenciales de la pasarela de pagos (aún sin definir).

## 12. Notas para Claude Code en este repo

- El ecommerce (`apps/web`) sigue siendo casi todo placeholders con `TODO`. El admin (`apps/admin`) ya tiene los 9 módulos con lógica real (ver sección 9) — no asumas que todavía es solo scaffold ahí. Antes de "arreglar" algo, confirmar si es un placeholder intencional documentado aquí o un bug real.
- `pnpm install` y `pnpm build` ya se verificaron (2026-08-27) — ambas apps compilan. Si algo no compila después de un cambio, es una regresión real, no un problema preexistente del scaffold.
- Git está inicializado, con `origin` en GitHub (`ricamocolombia/RicamoCol`) y el primer commit ya empujado a `main` (2026-08-27). No commitear ni hacer push sin que el usuario lo pida explícitamente en esa sesión — es una instrucción general del entorno, no específica de este proyecto, pero aplica con fuerza aquí porque el remoto ya es real.
- Los archivos `.env.local` de ambas apps tienen credenciales reales de Supabase (incluida la `service_role` key). Nunca imprimirlas en la bóveda de Obsidian, en `CLAUDE.md` ni en ningún archivo que se vaya a commitear — viven solo en `.env.local` (gitignored).
- **Si toca dividir trabajo en agentes en paralelo dentro de este repo** (como se hizo el 2026-08-27 para el módulo admin): asignar carpetas disjuntas a cada agente, prohibirles tocar `package.json`/`layout.tsx`/`middleware.ts`/archivos compartidos, prohibirles `pnpm install` y builds completos (chocan entre sí), prohibirles git — y hacer la integración (typecheck completo, remover workarounds de tipos, build final, commit) tú mismo al final, no delegarla.
- Un permission denied (`42501`) de Postgres al leer/escribir cualquier tabla nueva casi siempre significa que faltó el `GRANT` correspondiente, no que RLS esté mal — ver `0002_grants.sql` y su `ALTER DEFAULT PRIVILEGES`, que ya cubre las tablas futuras si se sigue aplicando cada migración en orden.
- Sigue el proceso de la sección 0 (leer/escribir en la bóveda de Obsidian) en cada sesión para que el contexto no se pierda entre conversaciones.
