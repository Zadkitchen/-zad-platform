"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

const ALLOWED_STATUSES = [
  "new",
  "confirmed",
  "preparing",
  "ready",
  "out_for_delivery",
  "delivered",
  "cancelled",
] as const;

type OrderStatus = (typeof ALLOWED_STATUSES)[number];

function isOrderStatus(value: string): value is OrderStatus {
  return ALLOWED_STATUSES.includes(value as OrderStatus);
}

export async function updateOrderStatus(formData: FormData) {
  const orderId = String(formData.get("order_id") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim();

  if (!orderId) {
    throw new Error("رقم الطلب غير موجود.");
  }

  if (!isOrderStatus(status)) {
    throw new Error("حالة الطلب غير صحيحة.");
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("يجب تسجيل الدخول إلى لوحة الإدارة.");
  }

  const { error } = await supabase
    .from("orders")
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", orderId);

  if (error) {
    console.error("Update order status error:", error);

    throw new Error(
      error.message || "تعذر تحديث حالة الطلب."
    );
  }

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
}