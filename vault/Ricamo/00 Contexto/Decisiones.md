# Decisiones de arquitectura y negocio

Registro estilo ADR: decisiones tomadas y el motivo. Cada decisión relevante nueva → añadir entrada aquí con fecha, no editar el historial existente.

## 2026-08-27 — Checkout híbrido
Catálogo/stock con pago en línea; pedidos 100% personalizados siempre pasan por cotización web → WhatsApp (no se fuerza pago en línea para personalizados porque el precio/diseño se define en la conversación).

## 2026-08-27 — App admin como web app responsive
No app móvil nativa (por ahora). Dashboard web desplegado en Vercel, accesible desde el celular por navegador. Se puede evaluar PWA más adelante si Maria Jose lo pide.

## 2026-08-27 — Sin facturación electrónica DIAN por ahora
La app registra ventas/compras/cuentas para control interno, sin emitir factura electrónica válida ante la DIAN. Revisar con un contador cuándo el negocio esté obligado a facturación electrónica.

## 2026-08-27 — Monorepo
Un repo en GitHub con `apps/web` (ecommerce), `apps/admin` (gestión), `packages/*` compartidos (Supabase client, UI/tokens de marca). Facilita compartir tipos y mantener ambas apps sincronizadas con el mismo backend en Supabase.

## 2026-08-27 — Stack técnico
GitHub (código) + Supabase (base de datos/auth/storage) + Vercel (despliegues) + Resend (emails transaccionales). Next.js (App Router) + TypeScript + Tailwind en ambas apps, pnpm + Turborepo para el monorepo.

## 2026-08-28 — Campos de producto en Ventas: una opción por campo, listas abiertas
Tipo de prenda, categoría de diseño, color y talla en un ítem de venta son campos de una sola opción cada uno (no selección múltiple real) — si se necesitan combinaciones distintas, se agrega otro ítem. Las listas de opciones (tipo de prenda, categoría) son abiertas: Maria Jose puede escribir un valor nuevo sobre la marcha y queda disponible como sugerencia la próxima vez, sin que haya que tocar código. Implementado con `<datalist>` de HTML, sin JavaScript de cliente.

## 2026-09-08 — Catálogo por diseño sin gate de aprobación; el modelo es "todo bajo demanda"
El usuario aclaró un hecho de negocio que no estaba modelado: Ricamo no tiene stock de prendas ya decoradas — todo se produce contra pedido. Lo único que se mantiene en stock real son las prendas en blanco (`inventory_items`, ya existente). Esto tumba dos reglas que sí tenían sentido para un flujo de "aprobar antes de vender": (1) que un diseño solo pudiera convertirse en producto vendible si su `status` era `aprobado`/`enviado_maquiladora`, y (2) que `product_variants.stock_quantity` gatillara "Agotado" en la web. Se quitó el gate de aprobación (el `status` del diseño queda solo para trackear el flujo interno de producción, desacoplado de si está publicado) y se dejó de usar `stock_quantity` en código nuevo (la columna sigue en la tabla, sin borrar, para no romper nada). Un diseño ahora puede tener varios `products` (uno por tipo de prenda: camiseta, buzo, tank top...) cada uno con varias tallas — antes el flujo solo permitía un producto con una talla por diseño. `garment_type` pasó de un `CHECK` fijo (`camiseta`/`buzo`) a texto libre, mismo criterio ya aplicado a `inventory_items` en `0006_bodegas.sql`.

El usuario también pidió, en el mismo turno, un checkout real con pago por transferencia (QR + comprobante que Maria Jose valida en máx. 4 horas hábiles) — pero eligió explícitamente secuenciar el trabajo: solo el modelo de catálogo (Fase 1) en esa sesión, el checkout (Fase 2) documentado y pendiente para una sesión futura. Ver [[../02 Pendientes/Backlog|Backlog]] y `C:\Users\57302\.claude\plans\encapsulated-floating-ember.md`.

## 2026-09-08 — Fase 2: checkout con comprobante, sin cobro automático nunca
Construida sobre la Fase 1 (mismo día, sesión posterior, a pedido explícito "avanza con la fase 2"). Decisión de diseño clave: el pago **nunca** se marca como recibido automáticamente — subir el comprobante solo pone el pedido en `payment_status = 'comprobante_pendiente'`, y es Maria Jose quien aprueba o rechaza a mano desde `/ventas/[id]` viendo la imagen real. Motivo: es una transferencia bancaria, no una pasarela con webhook de confirmación — no hay forma de verificar el pago automáticamente, y forzarlo sin validación abriría la puerta a que alguien reciba el pedido sin haber pagado. El bucket de Storage para el comprobante (`payment-proofs`) se hizo **privado** a propósito, a diferencia de `design-images` (público) — el comprobante puede traer datos sensibles del pagador y no debe quedar accesible por URL directa; el admin lo ve vía signed URL con expiración corta (15 min), generada en el servidor.

## 2026-10-27 — "Montar diseño" en un solo paso, sin cliente ni estado; siempre todas las tallas
Juan Camilo habló con Maria Jose: el modelo de Diseños estaba pensado como registro de diseños hechos para un cliente (cliente vinculado + estado borrador→aprobación→maquiladora) y montar uno a la página tomaba varias pantallas (crear diseño → gestionar catálogo → marcar prendas → agregar tallas una por una → publicar cada prenda). Quieren algo simple: montar el diseño con su descripción y que aparezca en la página. Además aclararon que **todo se hace a la medida**: el cliente elige talla (y si quiere una adaptación) al comprar, y Maria Jose manda a producir cuando está pago — por eso **cada prenda se ofrece siempre en todas las tallas**, no hay que elegirlas.

Decidido:
- `/disenos/nueva` pasa a ser **"Montar diseño"**: nombre, descripción, fotos, técnica, prendas (catálogo fijo de presentaciones, precio fijo en estampado / a mano en bordado), colección opcional y "publicar de una vez" (marcado por defecto). Un solo envío crea diseño + fotos + un `product` por prenda + todas las tallas, y si algo falla borra lo creado.
- Diseños ya no pide ni muestra cliente ni estado de producción. Las columnas `designs.customer_id`/`designs.status` **se dejaron en la tabla** (sin migración destructiva); los diseños nuevos se crean con `status = 'aprobado'` solo para cumplir el `CHECK`, el valor no se usa en ningún lado.
- La descripción pública vive en `products.description` (lo que ya mostraba la web) y "Editar" la aplica a todas las prendas del diseño — no se agregó columna nueva a `designs`.
- Tallas: `SIZE_OPTIONS` en `apps/admin/lib/presentations.ts` (S, M, L, XL, XXL — el negocio no maneja tallas de niño ni XS) es la lista única del negocio; toda prenda nace con todas. Se quitó el editor talla-por-talla (agregar/eliminar/precio por talla): el precio es uno por prenda y "Guardar precio" lo aplica a la prenda y a todas sus tallas, para que la web y el checkout nunca cobren distinto. `0015_todas_las_tallas.sql` completa los productos existentes.
- Checkout: campo opcional "¿Quieres alguna adaptación?" que queda en `orders.notes`.

---
Ver también: [[Negocio]]
