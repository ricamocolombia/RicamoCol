-- Ricamo — cuentas por pagar automaticas a los proveedores de produccion
-- (maquiladoras de estampado y de bordado).
--
-- Cada venta con tecnica + costo de decoracion genera su propia cuenta por
-- pagar al proveedor correspondiente, para poder verla y pagarla despues.
-- order_id deja rastro de que venta la origino (mismo patron que ya usa
-- accounts_receivable.order_id).

alter table accounts_payable add column order_id uuid references orders(id);

-- Que proveedor es "el de estampados" y "el de bordados" -- se define una
-- sola vez en Configuracion y de ahi en adelante toda venta con esa tecnica
-- carga la cuenta por pagar automaticamente. Mismo patron de app_settings
-- que ya se usa para el correo de alertas de inventario.
insert into app_settings (key, value)
values ('supplier_estampado_id', null), ('supplier_bordado_id', null)
on conflict (key) do nothing;
