-- Ricamo — precios fijos de las presentaciones de estampado.
--
-- El negocio tiene un catalogo fijo y conocido de "presentaciones" (tipo de
-- prenda + corte): en estampado el precio es fijo por presentacion (no varia
-- por diseno), en bordado si varia por diseno y se sigue escribiendo a mano
-- (por eso bordado no tiene fila aqui). Mismo patron exacto que
-- print_size_prices (0005_precios_estampado.sql).

create table garment_presentation_prices (
  presentation text primary key
    check (presentation in (
      'estampado_camiseta_regular', 'estampado_camiseta_oversize',
      'estampado_buzo_cuello_redondo', 'estampado_buzo_capucha'
    )),
  cost_cop integer,
  updated_at timestamptz not null default now()
);
create trigger garment_presentation_prices_set_updated_at before update on garment_presentation_prices
  for each row execute function set_updated_at();

insert into garment_presentation_prices (presentation, cost_cop) values
  ('estampado_camiseta_regular', 65000),
  ('estampado_camiseta_oversize', 70000),
  ('estampado_buzo_cuello_redondo', 110000),
  ('estampado_buzo_capucha', 120000);

alter table garment_presentation_prices enable row level security;

grant select, insert, update, delete on garment_presentation_prices to service_role;
grant select, insert, update, delete on garment_presentation_prices to authenticated;
grant select on garment_presentation_prices to anon;
