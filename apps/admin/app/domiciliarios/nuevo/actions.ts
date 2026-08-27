"use server";

import { redirect } from "next/navigation";
import { createServiceRoleClient } from "@ricamo/supabase/server";

export async function crearDomiciliario(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();
  const isActive = formData.get("is_active") === "on";

  if (!name) {
    redirect(
      `/domiciliarios/nuevo?error=${encodeURIComponent("El nombre es obligatorio")}`
    );
  }

  const supabase = createServiceRoleClient();

  const { error } = await supabase.from("couriers").insert({
    name,
    phone: phone || null,
    notes: notes || null,
    is_active: isActive,
  });

  if (error) {
    redirect(
      `/domiciliarios/nuevo?error=${encodeURIComponent(
        "No se pudo crear el domiciliario: " + error.message
      )}`
    );
  }

  redirect("/domiciliarios");
}
