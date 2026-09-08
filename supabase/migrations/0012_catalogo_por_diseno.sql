-- Ricamo — catalogo por diseño, sin gate de aprobacion.
--
-- Todo se hace bajo demanda: no existe stock de prendas ya decoradas (el
-- stock real son las prendas en blanco, ya modelado en inventory_items). Un
-- diseño puede ofrecerse en varios tipos de prenda (camiseta, buzo, tank
-- top...) y cada uno con varias tallas -- eso ya lo soportaba el esquema
-- (products/product_variants), lo que faltaba era abrir garment_type (hoy
-- fijo a camiseta/buzo) y quitar los bloqueos en el codigo del admin (eso se
-- hace en apps/admin, no aqui).
--
-- Mismo criterio ya aplicado a inventory_items en 0006_bodegas.sql: el
-- negocio maneja tipos de prenda variados, no una lista fija de 2.

alter table design_requests drop constraint if exists design_requests_garment_type_check;
alter table products drop constraint if exists products_garment_type_check;
alter table product_variants drop constraint if exists product_variants_garment_type_check;
