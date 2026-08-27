"use server";

import { redirect } from "next/navigation";
import { createServiceRoleClient } from "@ricamo/supabase/server";

const ALLOWED_STATUSES = ["aprobado", "enviado_maquiladora"] as const;
const GARMENT_TYPES = ["camiseta", "buzo"] as const;
type GarmentType = (typeof GARMENT_TYPES)[number];
function isGarmentType(value: string): value is GarmentType {
  return (GARMENT_TYPES as readonly string[]).includes(value);
}

function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // quita tildes tras la normalizacion NFD
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function fail(designId: string, message: string): never {
  redirect(`/disenos/${designId}/publicar?error=${encodeURIComponent(message)}`);
}

export async function crearProductoDesdeDiseno(formData: FormData) {
  const designId = String(formData.get("design_id") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const garmentTypeRaw = String(formData.get("garment_type") ?? "").trim();
  const basePriceRaw = String(formData.get("base_price_cop") ?? "");
  const size = String(formData.get("size") ?? "").trim();
  const stockRaw = String(formData.get("stock_quantity") ?? "0");

  if (!designId) {
    redirect(`/disenos?error=${encodeURIComponent("Diseño inválido")}`);
  }
  if (!name) {
    fail(designId, "El nombre del producto es obligatorio");
  }
  if (!isGarmentType(garmentTypeRaw)) {
    fail(designId, "Elige un tipo de prenda válido");
  }
  const garmentType: GarmentType = garmentTypeRaw;
  const basePrice = Number.parseInt(basePriceRaw, 10);
  if (!Number.isFinite(basePrice) || basePrice <= 0) {
    fail(designId, "El precio debe ser un número mayor a 0");
  }
  if (!size) {
    fail(designId, "La talla de la primera variante es obligatoria");
  }
  const stock = Number.parseInt(stockRaw, 10);
  if (!Number.isFinite(stock) || stock < 0) {
    fail(designId, "El stock inicial debe ser un número mayor o igual a 0");
  }

  const supabase = createServiceRoleClient();

  const { data: design, error: designError } = await supabase
    .from("designs")
    .select("id, name, technique, status")
    .eq("id", designId)
    .single();

  if (designError || !design) {
    redirect(`/disenos?error=${encodeURIComponent("No se encontró el diseño")}`);
  }

  // Re-validar en el servidor que el diseño esta aprobado -- no confiar en
  // que la UI ya lo filtro. Este es exactamente el punto que pidio el
  // negocio: un diseño solo se convierte en producto vendible si el
  // administrador lo aprobó primero.
  if (!(ALLOWED_STATUSES as readonly string[]).includes(design.status)) {
    fail(
      designId,
      "Este diseño todavía no está aprobado — solo se puede publicar como producto un diseño en estado 'aprobado' o 'enviado a maquiladora'"
    );
  }

  const { data: existingProduct } = await supabase
    .from("products")
    .select("id")
    .eq("design_id", designId)
    .maybeSingle();

  if (existingProduct) {
    redirect(`/disenos?error=${encodeURIComponent("Este diseño ya tiene un producto de catálogo")}`);
  }

  const baseSlug = slugify(name) || "producto";
  let slug = baseSlug;
  let suffix = 1;
  while (suffix <= 20) {
    const { data: collision } = await supabase
      .from("products")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();
    if (!collision) break;
    suffix += 1;
    slug = `${baseSlug}-${suffix}`;
  }

  const { data: product, error: productError } = await supabase
    .from("products")
    .insert({
      design_id: designId,
      name,
      slug,
      garment_type: garmentType,
      technique: design.technique,
      base_price_cop: basePrice,
      is_published: true,
    })
    .select("id")
    .single();

  if (productError || !product) {
    fail(
      designId,
      "No se pudo crear el producto: " +
        (productError?.message ?? "error desconocido")
    );
  }

  const { error: variantError } = await supabase.from("product_variants").insert({
    product_id: product.id,
    size,
    price_cop: basePrice,
    stock_quantity: stock,
  });

  if (variantError) {
    fail(
      designId,
      "El producto se creó pero no se pudo guardar la talla/variante: " +
        variantError.message
    );
  }

  const { error: designUpdateError } = await supabase
    .from("designs")
    .update({
      published_to_ecommerce: true,
      published_at: new Date().toISOString(),
    })
    .eq("id", designId);

  if (designUpdateError) {
    fail(
      designId,
      "El producto se creó pero no se pudo sincronizar el diseño: " +
        designUpdateError.message
    );
  }

  redirect("/disenos");
}
