"use server";

import { redirect } from "next/navigation";
import { createServiceRoleClient } from "@ricamo/supabase/server";
import { uploadDesignImage } from "../../../lib/storage";
import { syncDesignPublication } from "../../../lib/catalogPublication";
import {
  PRESENTATIONS,
  SIZE_OPTIONS,
  priceFieldName,
  crearSlugUnico,
} from "../../../lib/presentations";

const VALID_TECHNIQUES = ["bordado", "estampado"] as const;
type DesignTechnique = (typeof VALID_TECHNIQUES)[number];

function fail(message: string): never {
  redirect(`/disenos/nueva?error=${encodeURIComponent(message)}`);
}

function isDesignTechnique(value: string): value is DesignTechnique {
  return (VALID_TECHNIQUES as readonly string[]).includes(value);
}

// "Montar diseño": en un solo paso crea el diseño, sube sus fotos, crea un
// listado (product) por cada prenda marcada con sus tallas, y lo deja
// publicado en la web si asi se eligio. Sin cliente ni estado de produccion
// -- el diseño es del catalogo de Maria Jose, no un pedido de un cliente.
// Si algo falla a mitad, se borra lo que alcanzo a crearse para que el
// reintento no deje diseños/listados a medias.
export async function montarDiseno(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const technique = String(formData.get("technique") ?? "").trim();
  const collectionId = String(formData.get("collection_id") ?? "").trim();
  const publish = formData.get("publish") === "on";
  const presentationKeys = [...new Set(formData.getAll("presentation_keys").map(String))];
  // Todo se produce a la medida: cada prenda se ofrece en todas las tallas.
  const sizes = SIZE_OPTIONS;
  const images = formData.getAll("images").filter((f): f is File => f instanceof File && f.size > 0);

  if (!name) fail("Ponle un nombre al diseño");
  if (!isDesignTechnique(technique)) fail("Elige estampado o bordado");
  if (presentationKeys.length === 0) fail("Marca al menos una prenda");
  if (publish && images.length === 0) {
    fail("Sube al menos una foto para publicarlo en la página");
  }

  const supabase = createServiceRoleClient();

  // Precio por prenda: fijo en estampado (Configuracion), a mano en bordado.
  const priceByEstampadoKey = new Map<string, number | null>();
  if (technique === "estampado") {
    const { data: pricesData } = await supabase
      .from("garment_presentation_prices")
      .select("presentation, cost_cop");
    for (const p of pricesData ?? []) priceByEstampadoKey.set(p.presentation, p.cost_cop);
  }

  const garments: { key: string; label: string; price: number }[] = [];
  for (const key of presentationKeys) {
    const presentation = PRESENTATIONS.find((p) => p.key === key);
    if (!presentation || !(presentation.techniques as readonly string[]).includes(technique)) {
      fail(`Prenda inválida para ${technique}: ${key}`);
    }
    let price: number;
    if (technique === "estampado") {
      const configured = priceByEstampadoKey.get(presentation.estampadoPriceKey ?? "");
      if (configured == null) {
        fail(`El precio de "${presentation.label}" en estampado no está definido — ve a Configuración`);
      }
      price = configured;
    } else {
      const parsed = Number.parseInt(String(formData.get(priceFieldName(key)) ?? ""), 10);
      if (!Number.isFinite(parsed) || parsed <= 0) {
        fail(`Escribe el precio de "${presentation.label}"`);
      }
      price = parsed;
    }
    garments.push({ key: presentation.key, label: presentation.label, price });
  }

  const { data: design, error: designError } = await supabase
    .from("designs")
    .insert({ name, technique, status: "aprobado" })
    .select("id")
    .single();

  if (designError || !design) {
    fail("No se pudo crear el diseño: " + (designError?.message ?? "error desconocido"));
  }

  const uploadedUrls: string[] = [];
  const rollback = async (message: string): Promise<never> => {
    await supabase.from("products").delete().eq("design_id", design.id);
    await supabase.from("design_images").delete().eq("design_id", design.id);
    await supabase.from("designs").delete().eq("id", design.id);
    const paths = uploadedUrls
      .map((url) => url.split("/design-images/")[1])
      .filter((p): p is string => Boolean(p));
    if (paths.length > 0) await supabase.storage.from("design-images").remove(paths);
    fail(message);
  };

  for (let i = 0; i < images.length; i++) {
    try {
      const imageUrl = await uploadDesignImage(images[i], "disenos");
      uploadedUrls.push(imageUrl);
      const { error } = await supabase.from("design_images").insert({
        design_id: design.id,
        image_url: imageUrl,
        sort_order: i,
        is_cover: i === 0,
      });
      if (error) await rollback("No se pudo guardar una foto: " + error.message);
    } catch (uploadError) {
      const message = uploadError instanceof Error ? uploadError.message : "error desconocido";
      await rollback("No se pudo subir una foto: " + message);
    }
  }

  const reservedSlugs = new Set<string>();
  const productsToInsert = [];
  for (const garment of garments) {
    const slug = await crearSlugUnico(supabase, `${name} ${garment.label}`, reservedSlugs);
    reservedSlugs.add(slug);
    productsToInsert.push({
      design_id: design.id,
      name,
      slug,
      description: description || null,
      garment_type: garment.key,
      technique,
      base_price_cop: garment.price,
      collection_id: collectionId || null,
      is_published: publish,
    });
  }

  const { data: products, error: productsError } = await supabase
    .from("products")
    .insert(productsToInsert)
    .select("id, base_price_cop");

  if (productsError || !products) {
    await rollback("No se pudieron crear las prendas: " + (productsError?.message ?? "error desconocido"));
  }

  const variants = products!.flatMap((product) =>
    sizes.map((size) => ({ product_id: product.id, size, price_cop: product.base_price_cop }))
  );
  const { error: variantsError } = await supabase.from("product_variants").insert(variants);
  if (variantsError) {
    await rollback("No se pudieron crear las tallas: " + variantsError.message);
  }

  await syncDesignPublication(supabase, design.id);

  redirect(`/disenos?ok=${encodeURIComponent(publish ? `"${name}" ya está en la página` : `"${name}" quedó guardado sin publicar`)}`);
}
