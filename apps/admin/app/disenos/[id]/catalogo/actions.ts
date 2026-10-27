"use server";

import { redirect } from "next/navigation";
import { createServiceRoleClient } from "@ricamo/supabase/server";
import { syncDesignPublication, productHasSizes } from "../../../../lib/catalogPublication";

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
  redirect(`/disenos/${designId}/catalogo?error=${encodeURIComponent(message)}`);
}

// Catalogo fijo de presentaciones (prenda + corte) que ofrece el negocio.
// En estampado el precio es fijo por presentacion (garment_presentation_prices,
// configurable en /configuracion); en bordado el precio varia por diseno y
// se escribe a mano. Duplicado en page.tsx (misma constante, ese archivo la
// usa para renderizar los checkboxes).
const PRESENTATIONS = [
  {
    key: "camiseta regular",
    label: "Camiseta Regular",
    techniques: ["bordado", "estampado"],
    estampadoPriceKey: "estampado_camiseta_regular",
  },
  {
    key: "camiseta oversize",
    label: "Camiseta Oversize",
    techniques: ["bordado", "estampado"],
    estampadoPriceKey: "estampado_camiseta_oversize",
  },
  {
    key: "buzo cuello redondo",
    label: "Buzo Cuello Redondo",
    techniques: ["bordado", "estampado"],
    estampadoPriceKey: "estampado_buzo_cuello_redondo",
  },
  {
    key: "buzo capucha",
    label: "Buzo Capucha",
    techniques: ["bordado", "estampado"],
    estampadoPriceKey: "estampado_buzo_capucha",
  },
  { key: "tank top", label: "Tank top", techniques: ["bordado"], estampadoPriceKey: null },
] as const;

// El input de precio de cada presentacion (solo aplica en bordado) se
// nombra price__<key con espacios como guion bajo> -- mismo criterio en
// page.tsx al armar el formulario.
function priceFieldName(key: string): string {
  return `price__${key.replace(/\s+/g, "_")}`;
}

async function crearSlugUnico(
  supabase: ReturnType<typeof createServiceRoleClient>,
  base: string
): Promise<string> {
  const baseSlug = slugify(base) || "producto";
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
  return slug;
}

// Crea uno o varios listados (product) para este diseño de una sola vez,
// marcando las presentaciones del catalogo fijo que apliquen -- ya no hay
// limite de "un diseño = un producto" ni gate de aprobacion. Nacen sin
// publicar (is_published = false) hasta que tengan al menos una talla.
export async function agregarPresentaciones(formData: FormData) {
  const designId = String(formData.get("design_id") ?? "").trim();
  const selectedKeys = formData.getAll("presentation_keys").map((v) => String(v));

  if (!designId) {
    redirect(`/disenos?error=${encodeURIComponent("Diseño inválido")}`);
  }
  if (selectedKeys.length === 0) {
    fail(designId, "Selecciona al menos una prenda");
  }

  const supabase = createServiceRoleClient();

  const { data: design, error: designError } = await supabase
    .from("designs")
    .select("id, name, technique")
    .eq("id", designId)
    .single();

  if (designError || !design) {
    redirect(`/disenos?error=${encodeURIComponent("No se encontró el diseño")}`);
  }

  let priceByEstampadoKey: Map<string, number | null> | null = null;
  if (design.technique === "estampado") {
    const { data: pricesData } = await supabase
      .from("garment_presentation_prices")
      .select("presentation, cost_cop");
    priceByEstampadoKey = new Map((pricesData ?? []).map((p) => [p.presentation, p.cost_cop]));
  }

  // La UI ya oculta las prendas que el diseño tiene, pero un doble envio o
  // una pestana vieja crearian listados duplicados -- se re-verifica aqui.
  const { data: existingData } = await supabase
    .from("products")
    .select("garment_type")
    .eq("design_id", designId);
  const existingGarmentTypes = new Set((existingData ?? []).map((p) => p.garment_type));

  const toInsert: { garment_type: string; base_price_cop: number; slug: string }[] = [];

  for (const key of selectedKeys) {
    const presentation = PRESENTATIONS.find((p) => p.key === key);
    if (!presentation || !(presentation.techniques as readonly string[]).includes(design.technique)) {
      fail(designId, `Prenda inválida: ${key}`);
    }
    if (existingGarmentTypes.has(presentation.key)) {
      continue;
    }

    let price: number;
    if (design.technique === "estampado") {
      const configured = priceByEstampadoKey?.get(presentation.estampadoPriceKey ?? "");
      if (configured === null || configured === undefined) {
        fail(
          designId,
          `El precio de "${presentation.label}" no está configurado — ve a Configuración para definirlo`
        );
      }
      price = configured;
    } else {
      const raw = String(formData.get(priceFieldName(key)) ?? "").trim();
      const parsed = Number.parseInt(raw, 10);
      if (!Number.isFinite(parsed) || parsed <= 0) {
        fail(designId, `El precio de "${presentation.label}" debe ser un número mayor a 0`);
      }
      price = parsed;
    }

    const slug = await crearSlugUnico(supabase, `${design.name} ${presentation.label}`);
    toInsert.push({ garment_type: presentation.key, base_price_cop: price, slug });
  }

  // Un solo insert: o se crean todos los listados marcados o ninguno.
  if (toInsert.length > 0) {
    const { error: productError } = await supabase.from("products").insert(
      toInsert.map((item) => ({
        design_id: designId,
        name: design.name,
        slug: item.slug,
        garment_type: item.garment_type,
        technique: design.technique,
        base_price_cop: item.base_price_cop,
        is_published: false,
      }))
    );

    if (productError) {
      fail(designId, "No se pudieron crear los listados: " + productError.message);
    }
  }

  redirect(`/disenos/${designId}/catalogo`);
}

export async function agregarTalla(formData: FormData) {
  const designId = String(formData.get("design_id") ?? "").trim();
  const productId = String(formData.get("product_id") ?? "").trim();
  const size = String(formData.get("size") ?? "").trim();
  const priceRaw = String(formData.get("price_cop") ?? "");

  if (!designId || !productId) {
    redirect(`/disenos?error=${encodeURIComponent("Datos inválidos")}`);
  }
  if (!size) {
    fail(designId, "La talla es obligatoria");
  }
  const supabase = createServiceRoleClient();

  // Sin precio propio, la talla hereda el precio del listado -- es el que se
  // muestra en el catalogo, y el checkout cobra el de la talla.
  let price: number;
  if (priceRaw.trim() === "") {
    const { data: product } = await supabase
      .from("products")
      .select("base_price_cop")
      .eq("id", productId)
      .maybeSingle();
    if (!product) {
      fail(designId, "No se encontró el listado");
    }
    price = product.base_price_cop;
  } else {
    price = Number.parseInt(priceRaw, 10);
    if (!Number.isFinite(price) || price <= 0) {
      fail(designId, "El precio de la talla debe ser un número mayor a 0");
    }
  }

  const { error } = await supabase.from("product_variants").insert({
    product_id: productId,
    size,
    price_cop: price,
  });

  if (error) {
    fail(designId, "No se pudo agregar la talla: " + error.message);
  }

  redirect(`/disenos/${designId}/catalogo`);
}

export async function eliminarTalla(formData: FormData) {
  const designId = String(formData.get("design_id") ?? "").trim();
  const variantId = String(formData.get("variant_id") ?? "").trim();

  if (!designId || !variantId) {
    redirect(`/disenos?error=${encodeURIComponent("Datos inválidos")}`);
  }

  const supabase = createServiceRoleClient();

  const { data: variant } = await supabase
    .from("product_variants")
    .select("product_id")
    .eq("id", variantId)
    .maybeSingle();

  if (variant) {
    const [{ data: product }, { count }] = await Promise.all([
      supabase.from("products").select("is_published").eq("id", variant.product_id).maybeSingle(),
      supabase
        .from("product_variants")
        .select("id", { count: "exact", head: true })
        .eq("product_id", variant.product_id),
    ]);
    if (product?.is_published && (count ?? 0) <= 1) {
      fail(designId, "Es la única talla de un listado publicado — despublícalo primero o agrega otra talla");
    }
  }

  const { error } = await supabase.from("product_variants").delete().eq("id", variantId);

  if (error) {
    // 23503: la talla ya aparece en pedidos (order_items la referencia).
    fail(
      designId,
      error.code === "23503"
        ? "Esa talla ya tiene ventas registradas, no se puede eliminar"
        : "No se pudo eliminar la talla: " + error.message
    );
  }

  redirect(`/disenos/${designId}/catalogo`);
}

// Asigna coleccion y curacion (destacado / mas vendido / segmentos de
// regalo) de un listado -- misma logica que apps/admin/app/catalogo/actions.ts,
// pero redirige de vuelta a esta pantalla en vez de a /catalogo.
export async function actualizarListadoCatalogo(formData: FormData) {
  const designId = String(formData.get("design_id") ?? "").trim();
  const id = String(formData.get("id") ?? "").trim();
  const collectionId = String(formData.get("collection_id") ?? "").trim();
  const isFeatured = formData.get("is_featured") === "on";
  const isBestseller = formData.get("is_bestseller") === "on";
  const giftSegmentIds = formData.getAll("gift_segment_ids").map(String).filter(Boolean);

  if (!designId || !id) {
    redirect(`/disenos?error=${encodeURIComponent("Datos inválidos")}`);
  }

  const supabase = createServiceRoleClient();

  const { error } = await supabase
    .from("products")
    .update({
      collection_id: collectionId || null,
      is_featured: isFeatured,
      is_bestseller: isBestseller,
    })
    .eq("id", id);

  if (error) {
    fail(designId, "No se pudo actualizar el listado: " + error.message);
  }

  const { error: deleteError } = await supabase
    .from("product_gift_segments")
    .delete()
    .eq("product_id", id);

  if (deleteError) {
    fail(designId, "El listado se actualizó pero no se pudieron limpiar sus segmentos de regalo: " + deleteError.message);
  }

  if (giftSegmentIds.length > 0) {
    const { error: insertError } = await supabase
      .from("product_gift_segments")
      .insert(giftSegmentIds.map((giftSegmentId) => ({ product_id: id, gift_segment_id: giftSegmentId })));

    if (insertError) {
      fail(designId, "El listado se actualizó pero no se pudieron guardar sus segmentos de regalo: " + insertError.message);
    }
  }

  redirect(`/disenos/${designId}/catalogo`);
}

export async function toggleListadoPublicado(formData: FormData) {
  const designId = String(formData.get("design_id") ?? "").trim();
  const id = String(formData.get("id") ?? "").trim();
  const isPublished = formData.get("is_published") === "true";

  if (!designId || !id) {
    redirect(`/disenos?error=${encodeURIComponent("Datos inválidos")}`);
  }

  const supabase = createServiceRoleClient();
  const newValue = !isPublished;

  if (newValue && !(await productHasSizes(supabase, id))) {
    fail(designId, "Agrega al menos una talla antes de publicar este listado");
  }

  const { error: productError } = await supabase
    .from("products")
    .update({ is_published: newValue })
    .eq("id", id);

  if (productError) {
    fail(designId, "No se pudo actualizar la publicación: " + productError.message);
  }

  const { error: designUpdateError } = await syncDesignPublication(supabase, designId);

  if (designUpdateError) {
    fail(designId, "El listado se actualizó pero no se pudo sincronizar el diseño: " + designUpdateError);
  }

  redirect(`/disenos/${designId}/catalogo`);
}
