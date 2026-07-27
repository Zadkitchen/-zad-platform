"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "../../../lib/supabase/server";

function getText(formData: FormData, name: string) {
  return String(formData.get(name) ?? "").trim();
}

function getBoolean(formData: FormData, name: string) {
  return formData.get(name) === "on";
}

function getNumber(
  formData: FormData,
  name: string,
  fallback = 0
) {
  const value = Number(formData.get(name));

  if (!Number.isFinite(value) || value < 0) {
    return fallback;
  }

  return Math.round(value);
}

function normalizeWhatsAppNumber(value: string) {
  return value.replace(/[^\d]/g, "");
}

async function requireAdmin() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  const { data: admin, error } = await supabase
    .from("admin_users")
    .select("active")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !admin || admin.active !== true) {
    await supabase.auth.signOut();
    redirect("/admin/login");
  }

  return { supabase, user };
}

export async function updatePlatformSettings(
  formData: FormData
) {
  const { supabase, user } = await requireAdmin();

  const restaurantName = getText(
    formData,
    "restaurant_name"
  );

  const whatsappNumber = normalizeWhatsAppNumber(
    getText(formData, "whatsapp_number")
  );

  if (!restaurantName) {
    redirect(
      `/admin/settings?error=${encodeURIComponent(
        "اسم المطبخ مطلوب."
      )}`
    );
  }

  if (!whatsappNumber) {
    redirect(
      `/admin/settings?error=${encodeURIComponent(
        "رقم الواتساب مطلوب."
      )}`
    );
  }

  const settings = {
    id: 1,
    restaurant_name: restaurantName,
    slogan: getText(formData, "slogan"),

    whatsapp_number: whatsappNumber,
    phone_number: getText(formData, "phone_number"),
    address: getText(formData, "address"),
    google_maps_url: getText(
      formData,
      "google_maps_url"
    ),
    instagram_url: getText(
      formData,
      "instagram_url"
    ),
    facebook_url: getText(
      formData,
      "facebook_url"
    ),

    accepting_orders: getBoolean(
      formData,
      "accepting_orders"
    ),
    kitchen_open: getBoolean(
      formData,
      "kitchen_open"
    ),

    morning_shift_enabled: getBoolean(
      formData,
      "morning_shift_enabled"
    ),
    morning_start:
      getText(formData, "morning_start") || "10:30",
    morning_end:
      getText(formData, "morning_end") || "15:00",

    evening_shift_enabled: getBoolean(
      formData,
      "evening_shift_enabled"
    ),
    evening_start:
      getText(formData, "evening_start") || "16:00",
    evening_end:
      getText(formData, "evening_end") || "00:00",

    delivery_inside_area: getNumber(
      formData,
      "delivery_inside_area"
    ),
    delivery_outside_area: getNumber(
      formData,
      "delivery_outside_area"
    ),
    minimum_order: getNumber(
      formData,
      "minimum_order"
    ),
    free_delivery_threshold: getNumber(
      formData,
      "free_delivery_threshold"
    ),

    banner_enabled: getBoolean(
      formData,
      "banner_enabled"
    ),
    banner_text: getText(formData, "banner_text"),

    closed_message:
      getText(formData, "closed_message") ||
      "نعتذر، المطبخ مغلق حالياً.",

    orders_paused_message:
      getText(formData, "orders_paused_message") ||
      "نعتذر، تم إيقاف استقبال الطلبات مؤقتاً.",

    updated_at: new Date().toISOString(),
    updated_by: user.id,
  };

  const { error } = await supabase
    .from("platform_settings")
    .upsert(settings, {
      onConflict: "id",
    });

  if (error) {
    console.error("Settings update error:", error);

    redirect(
      `/admin/settings?error=${encodeURIComponent(
        `تعذر حفظ الإعدادات: ${error.message}`
      )}`
    );
  }

  revalidatePath("/");
  revalidatePath("/lunch");
  revalidatePath("/evening");
  revalidatePath("/admin");
  revalidatePath("/admin/settings");

  redirect(
    `/admin/settings?success=${encodeURIComponent(
      "تم حفظ إعدادات المنصة بنجاح."
    )}`
  );
}