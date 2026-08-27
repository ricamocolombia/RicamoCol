"use server";

import { redirect } from "next/navigation";
import { createServiceRoleClient } from "@ricamo/supabase/server";

const VALID_TYPES = ["maquiladora", "prendas", "insumos", "otro"] as const;
type SupplierType = (typeof VALID_TYPES)[number];

function fail(message: string): never {
  redirect(`/proveedores?error=${encodeURIComponent(message)}`);
}

function isSupplierType(value: string): value is SupplierType {
  return (VALID_TYPES as readonly string[]).includes(value);
}

export async function crearProveedor(formData: FormData) {
  const supabase = createServiceRoleClient();

  const name = String(formData.get("name") ?? "").trim();
  const type = String(formData.get("type") ?? "").trim();
  const contactName = String(formData.get("contact_name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  if (!name) {
    fail("El nombre del proveedor es obligatorio");
  }
  if (!isSupplierType(type)) {
    fail("El tipo de proveedor no es válido");
  }

  const { error } = await supabase.from("suppliers").insert({
    name,
    type,
    contact_name: contactName || null,
    phone: phone || null,
    email: email || null,
    notes: notes || null,
  });

  if (error) {
    fail("No se pudo crear el proveedor: " + error.message);
  }

  redirect("/proveedores");
}
