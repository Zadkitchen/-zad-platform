import { NextResponse } from "next/server";

import { createClient } from "../../../lib/supabase/server";

export async function GET() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("platform_settings")
    .select(`
      restaurant_name,
      slogan,
      whatsapp_number,
      phone_number,
      address,
      google_maps_url,
      instagram_url,
      facebook_url,
      accepting_orders,
      kitchen_open,
      morning_shift_enabled,
      morning_start,
      morning_end,
      evening_shift_enabled,
      evening_start,
      evening_end,
      delivery_inside_area,
      delivery_outside_area,
      minimum_order,
      free_delivery_threshold,
      banner_enabled,
      banner_text,
      closed_message,
      orders_paused_message
    `)
    .eq("id", 1)
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      {
        error: "تعذر تحميل إعدادات المنصة",
        details: error.message,
      },
      { status: 500 }
    );
  }

  return NextResponse.json(data);
}