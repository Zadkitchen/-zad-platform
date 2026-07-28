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

function getDecimal(
  formData: FormData,
  name: string,
  fallback = 0
) {
  const value = Number(formData.get(name));

  if (!Number.isFinite(value)) {
    return fallback;
  }

  return value;
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

  const kitchenLatitude = getDecimal(
    formData,
    "kitchen_latitude",
    30.4745
  );

  const kitchenLongitude = getDecimal(
    formData,
    "kitchen_longitude",
    47.805556
  );

  const deliveryBaseDistanceKm = getDecimal(
    formData,
    "delivery_base_distance_km",
    5
  );

  const deliveryStepDistanceKm = getDecimal(
    formData,
    "delivery_step_distance_km",
    5
  );

  const deliveryMaxDistanceKm = getDecimal(
    formData,
    "delivery_max_distance_km",
    20
  );

  if (
    kitchenLatitude < -90 ||
    kitchenLatitude > 90
  ) {
    redirect(
      `/admin/settings?error=${encodeURIComponent(
        "خط عرض المطبخ غير صحيح."
      )}`
    );
  }

  if (
    kitchenLongitude < -180 ||
    kitchenLongitude > 180
  ) {
    redirect(
      `/admin/settings?error=${encodeURIComponent(
        "خط طول المطبخ غير صحيح."
      )}`
    );
  }

  if (deliveryBaseDistanceKm <= 0) {
    redirect(
      `/admin/settings?error=${encodeURIComponent(
        "مسافة الشريحة الأولى يجب أن تكون أكبر من صفر."
      )}`
    );
  }

  if (deliveryStepDistanceKm <= 0) {
    redirect(
      `/admin/settings?error=${encodeURIComponent(
        "مسافة الشريحة الإضافية يجب أن تكون أكبر من صفر."
      )}`
    );
  }

  if (
    deliveryMaxDistanceKm <
    deliveryBaseDistanceKm
  ) {
    redirect(
      `/admin/settings?error=${encodeURIComponent(
        "أقصى مسافة للتوصيل يجب أن تكون أكبر من أو تساوي مسافة الشريحة الأولى."
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
      getText(formData, "morning_start") ||
      "10:30",

    morning_end:
      getText(formData, "morning_end") ||
      "15:00",

    evening_shift_enabled: getBoolean(
      formData,
      "evening_shift_enabled"
    ),

    evening_start:
      getText(formData, "evening_start") ||
      "16:00",

    evening_end:
      getText(formData, "evening_end") ||
      "00:00",

    delivery_enabled: getBoolean(
      formData,
      "delivery_enabled"
    ),

    kitchen_latitude: kitchenLatitude,
    kitchen_longitude: kitchenLongitude,

    delivery_base_distance_km:
      deliveryBaseDistanceKm,

    delivery_base_fee: getNumber(
      formData,
      "delivery_base_fee",
      1000
    ),

    delivery_step_distance_km:
      deliveryStepDistanceKm,

    delivery_step_fee: getNumber(
      formData,
      "delivery_step_fee",
      1000
    ),

    delivery_max_distance_km:
      deliveryMaxDistanceKm,

    minimum_order: getNumber(
      formData,
      "minimum_order",
      0
    ),

    free_delivery_threshold: getNumber(
      formData,
      "free_delivery_threshold",
      0
    ),

    banner_enabled: getBoolean(
      formData,
      "banner_enabled"
    ),

    banner_text: getText(
      formData,
      "banner_text"
    ),

    closed_message:
      getText(formData, "closed_message") ||
      "نعتذر، المطبخ مغلق حالياً.",

    orders_paused_message:
      getText(
        formData,
        "orders_paused_message"
      ) ||
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
    console.error(
      "Settings update error:",
      error
    );

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
  revalidatePath("/api/orders");

  redirect(
    `/admin/settings?success=${encodeURIComponent(
      "تم حفظ إعدادات المنصة بنجاح."
    )}`
  );
}