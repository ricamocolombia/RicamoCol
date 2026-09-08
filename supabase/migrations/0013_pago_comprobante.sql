-- Ricamo — checkout con pago por comprobante (Fase 2 del catalogo por diseño).
--
-- El cliente que no quiere personalizar nada puede comprar directo en la
-- web: elige tipo de prenda + talla ya publicados, transfiere a la cuenta
-- de Maria Jose (QR + datos configurables en /configuracion) y sube el
-- comprobante. Eso crea un pedido en estado "comprobante_pendiente" que
-- Maria Jose aprueba o rechaza desde /ventas/[id] -- nunca se cobra nada
-- automaticamente, ella siempre valida a mano antes de producir.

-- Bucket PRIVADO -- a diferencia de design-images (publico), el comprobante
-- de pago es un dato sensible (numero de cuenta, nombre del pagador) que
-- solo debe ver el admin, nunca quedar accesible por URL directa. Toda
-- subida y lectura pasa por la service_role key (Server Actions), que
-- ignora RLS de Storage igual que ya hace con las tablas -- no hace falta
-- ninguna politica de storage.objects para anon/authenticated.
insert into storage.buckets (id, name, public)
values ('payment-proofs', 'payment-proofs', false)
on conflict (id) do nothing;

alter table orders add column if not exists payment_proof_path text;
alter table orders add column if not exists payment_proof_uploaded_at timestamptz;

alter table orders drop constraint if exists orders_payment_status_check;
alter table orders add constraint orders_payment_status_check
  check (payment_status in ('pendiente', 'comprobante_pendiente', 'anticipo_pagado', 'pagado', 'reembolsado'));

-- El checkout publico (apps/web, cliente anon) necesita leer el QR + datos
-- de cuenta para mostrarlos antes de pagar. app_settings en general sigue
-- bloqueada para anon (RLS sin politica, solo el GRANT de 0006) -- esta
-- policy abre lectura publica SOLO de esas dos claves, nada mas.
create policy "Lectura publica de configuracion de pago"
  on app_settings for select
  to anon, authenticated
  using (key in ('payment_qr_image_url', 'payment_bank_account_info'));
