-- Ricamo — todas las prendas del catalogo se ofrecen en todas las tallas.
--
-- El negocio produce todo a la medida despues del pago (el cliente elige
-- talla y si quiere alguna adaptacion; Maria Jose lo manda a producir
-- cuando esta pago), asi que cada listado publicado debe tener siempre
-- todas las tallas. Desde el 2026-10-27 el admin ya crea cada prenda con
-- todas (SIZE_OPTIONS en apps/admin/lib/presentations.ts); esta migracion
-- completa las que les falten a los productos creados antes, al precio
-- base del producto. Idempotente: se puede correr mas de una vez.

insert into product_variants (product_id, size, price_cop)
select p.id, s.size, p.base_price_cop
from products p
cross join (values ('S'), ('M'), ('L'), ('XL'), ('XXL')) as s(size)
where not exists (
  select 1 from product_variants v
  where v.product_id = p.id and v.size = s.size
);
