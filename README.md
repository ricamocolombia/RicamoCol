# Ricamo

Monorepo de la plataforma de Ricamo: ecommerce + app de administración del negocio.

Ver [CLAUDE.md](./CLAUDE.md) para el contexto completo del negocio, la arquitectura, el modelo de datos y el roadmap. La bitácora de progreso y el backlog vivo están en la bóveda de Obsidian en [`vault/Ricamo`](./vault/Ricamo).

## Estructura

```
apps/
  web/     -> ecommerce (Next.js) — catalogo, personalizados, marca personal
  admin/   -> gestion del negocio (Next.js) — ventas, compras, inventario, cuentas, etc.
packages/
  ui/        -> tokens de marca (colores) compartidos
  supabase/  -> clientes de Supabase (browser, server, service role) y tipos
supabase/
  migrations/ -> esquema de base de datos (SQL)
vault/
  Ricamo/    -> boveda de Obsidian: memoria del proyecto entre sesiones
```

## Primeros pasos

```bash
pnpm install
pnpm dev          # corre web (puerto 3000) y admin (puerto 3001) en paralelo
pnpm dev:web      # solo el ecommerce
pnpm dev:admin    # solo la app de administracion
```

Copiar `apps/web/.env.example` a `apps/web/.env.local` y `apps/admin/.env.example` a `apps/admin/.env.local`, y completar las credenciales de Supabase, Resend, WhatsApp y la pasarela de pagos.

## Base de datos

El esquema vive en `supabase/migrations/`. Con el proyecto de Supabase ya creado:

```bash
supabase login
supabase link --project-ref <ref>
supabase db push
```
