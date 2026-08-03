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

function getOptionalDateTime(
  formData: FormData,
  name: string
) {
  const value = getText(formData, name);

  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString();
}

function normalizeWhatsAppNumber(value: string) {
  return value.replace(/[^\d]/g, "");
}

function redirectWithError(message: string): never {
  redirect(
    `/admin/settings?error=${encodeURIComponent(
      message
    )}`
  );
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
    redirectWithError("اسم المطبخ مطلوب.");
  }

  if (!whatsappNumber) {
    redirectWithError("رقم الواتساب مطلوب.");
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
    redirectWithError(
      "خط عرض المطبخ غير صحيح."
    );
  }

  if (
    kitchenLongitude < -180 ||
    kitchenLongitude > 180
  ) {
    redirectWithError(
      "خط طول المطبخ غير صحيح."
    );
  }

  if (deliveryBaseDistanceKm <= 0) {
    redirectWithError(
      "مسافة الشريحة الأولى يجب أن تكون أكبر من صفر."
    );
  }

  if (deliveryStepDistanceKm <= 0) {
    redirectWithError(
      "مسافة الشريحة الإضافية يجب أن تكون أكبر من صفر."
    );
  }

  if (
    deliveryMaxDistanceKm <
    deliveryBaseDistanceKm
  ) {
    redirectWithError(
      "أقصى مسافة للتوصيل يجب أن تكون أكبر من أو تساوي مسافة الشريحة الأولى."
    );
  }

  const globalOfferEnabled = getBoolean(
    formData,
    "global_offer_enabled"
  );

  const globalOfferName =
    getText(formData, "global_offer_name") ||
    "عرض زاد";

  const globalOfferType = getText(
    formData,
    "global_offer_type"
  );

  const globalOfferValue = getNumber(
    formData,
    "global_offer_value",
    0
  );

  const globalOfferStartsAt =
    getOptionalDateTime(
      formData,
      "global_offer_starts_at"
    );

  const globalOfferEndsAt =
    getOptionalDateTime(
      formData,
      "global_offer_ends_at"
    );

  if (
    !["percentage", "fixed"].includes(
      globalOfferType
    )
  ) {
    redirectWithError(
      "نوع الخصم العام غير صحيح."
    );
  }

  if (
    globalOfferEnabled &&
    globalOfferValue <= 0
  ) {
    redirectWithError(
      "قيمة العرض العام يجب أن تكون أكبر من صفر."
    );
  }

  if (
    globalOfferType === "percentage" &&
    globalOfferValue > 100
  ) {
    redirectWithError(
      "نسبة الخصم العام لا يمكن أن تتجاوز 100%."
    );
  }

  if (
    globalOfferStartsAt &&
    globalOfferEndsAt &&
    new Date(globalOfferEndsAt).getTime() <=
      new Date(globalOfferStartsAt).getTime()
  ) {
    redirectWithError(
      "نهاية العرض يجب أن تكون بعد بداية العرض."
    );
  }

  const loyaltyEnabled = getBoolean(
    formData,
    "loyalty_enabled"
  );

  const loyaltyRequiredOrders = getNumber(
    formData,
    "loyalty_required_orders",
    5
  );

  const loyaltyDiscountType = getText(
    formData,
    "loyalty_discount_type"
  );

  const loyaltyDiscountValue = getNumber(
    formData,
    "loyalty_discount_value",
    0
  );

  if (loyaltyRequiredOrders < 1) {
    redirectWithError(
      "عدد الطلبات المطلوبة للولاء يجب أن يكون 1 أو أكثر."
    );
  }

  if (
    !["percentage", "fixed"].includes(
      loyaltyDiscountType
    )
  ) {
    redirectWithError(
      "نوع خصم الولاء غير صحيح."
    );
  }

  if (
    loyaltyEnabled &&
    loyaltyDiscountValue <= 0
  ) {
    redirectWithError(
      "قيمة خصم الولاء يجب أن تكون أكبر من صفر."
    );
  }

  if (
    loyaltyDiscountType === "percentage" &&
    loyaltyDiscountValue > 100
  ) {
    redirectWithError(
      "نسبة خصم الولاء لا يمكن أن تتجاوز 100%."
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

    global_offer_enabled:
      globalOfferEnabled,

    global_offer_name:
      globalOfferName,

    global_offer_type:
      globalOfferType,

    global_offer_value:
      globalOfferValue,

    global_offer_starts_at:
      globalOfferStartsAt,

    global_offer_ends_at:
      globalOfferEndsAt,

    global_offer_min_item_price:
      getNumber(
        formData,
        "global_offer_min_item_price",
        0
      ),

    global_offer_exclude_addons:
      getBoolean(
        formData,
        "global_offer_exclude_addons"
      ),

    global_offer_exclude_drinks:
      getBoolean(
        formData,
        "global_offer_exclude_drinks"
      ),

    loyalty_enabled:
      loyaltyEnabled,

    loyalty_required_orders:
      loyaltyRequiredOrders,

    loyalty_discount_type:
      loyaltyDiscountType,

    loyalty_discount_value:
      loyaltyDiscountValue,

    loyalty_max_discount:
      getNumber(
        formData,
        "loyalty_max_discount",
        0
      ),

    loyalty_min_order_amount:
      getNumber(
        formData,
        "loyalty_min_order_amount",
        0
      ),

    loyalty_include_delivery:
      getBoolean(
        formData,
        "loyalty_include_delivery"
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

    redirectWithError(
      `تعذر حفظ الإعدادات: ${error.message}`
    );
  }

  revalidatePath("/");
  revalidatePath("/lunch");
  revalidatePath("/evening");
  revalidatePath("/admin");
  revalidatePath("/admin/settings");
  revalidatePath("/api/orders");
  revalidatePath(
    "/api/platform-settings"
  );

  redirect(
    `/admin/settings?success=${encodeURIComponent(
      "تم حفظ إعدادات المنصة والعروض والولاء بنجاح."
    )}`
  );
}