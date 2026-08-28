-- Ricamo — registro completo de ventas: datos del cliente, del producto
-- vendido, del pago, del envio, y de los costos de produccion (para poder
-- calcular rentabilidad bruta por venta).
--
-- "tipo de prenda", "categoria de diseno", "color" y "talla" quedan como
-- texto libre (sin CHECK ni tabla de catalogo) a proposito: el negocio pidio
-- que Maria Jose pueda escribir una opcion nueva sobre la marcha sin que
-- haya que tocar codigo. La app sugiere valores ya usados via <datalist>.

alter table customers add column id_number text;
alter table customers add column address text;
alter table customers add column neighborhood text;

alter table orders add column shipping_type text
  check (shipping_type in ('nacional', 'local'));
alter table orders add column shipping_payment_status text
  check (shipping_payment_status in ('contraentrega', 'pagado'));

alter table order_items add column garment_type text;
alter table order_items add column design_category text;
alter table order_items add column color text;
alter table order_items add column size text;
alter table order_items add column technique text
  check (technique in ('bordado', 'estampado'));
alter table order_items add column print_size text
  check (print_size in ('punto_corazon', 'media_carta', 'carta', 'oficio', 'tabloide'));
-- Costo unitario de la decoracion (bordado o estampado) para ese item, no
-- el costo de la prenda en si. unit_price_cop (precio de venta) menos
-- cost_cop (costo) por cantidad = rentabilidad bruta de esa linea.
alter table order_items add column cost_cop integer;
