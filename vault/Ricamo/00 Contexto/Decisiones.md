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

El usuario también pidió, en el mismo turno, un checkout real con pago por transferencia (QR + comprobante que Maria Jose valida en máx. 4 horas hábiles) — pero eligió explícitamente secuenciar el trabajo: solo el modelo de catálogo (Fase 1) en esta sesión, el checkout (Fase 2) documentado y pendiente para una sesión futura. Ver [[../02 Pendientes/Backlog|Backlog]] y `C:\Users\57302\.claude\plans\encapsulated-floating-ember.md`.

---
Ver también: [[Negocio]]
