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

---
Ver también: [[Negocio]]
