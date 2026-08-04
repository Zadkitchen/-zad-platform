import { NextResponse } from "next/server";

import { createClient } from "../../../lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("platform_settings")
      .select(
        `
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

          delivery_enabled,

          kitchen_latitude,
          kitchen_longitude,

          delivery_base_distance_km,
          delivery_base_fee,

          delivery_step_distance_km,
          delivery_step_fee,

          delivery_max_distance_km,

          delivery_inside_area,
          delivery_outside_area,

          minimum_order,
          free_delivery_threshold,

          banner_enabled,
          banner_text,

          closed_message,
          orders_paused_message
        `
      )
      .eq("id", 1)
      .maybeSingle();

    if (error) {
      console.error(
        "Platform settings fetch error:",
        error
      );

      return NextResponse.json(
        {
          error:
            "تعذر تحميل إعدادات المنصة",
          details: error.message,
        },
        {
          status: 500,
          headers: {
            "Cache-Control":
              "no-store, no-cache, must-revalidate",
          },
        }
      );
    }

    if (!data) {
      return NextResponse.json(
        {
          error:
            "لم يتم العثور على إعدادات المنصة.",
        },
        {
          status: 404,
          headers: {
            "Cache-Control":
              "no-store, no-cache, must-revalidate",
          },
        }
      );
    }

    /*
     * نرسل أسماء kitchen المعتمدة،
     * ونرسل aliases باسم restaurant
     * للتوافق مع أي نسخة قديمة من CartDrawer.
     */
    const response = {
      ...data,

      restaurant_latitude:
        data.kitchen_latitude,

      restaurant_longitude:
        data.kitchen_longitude,
    };

    return NextResponse.json(response, {
      status: 200,
      headers: {
        "Cache-Control":
          "no-store, no-cache, must-revalidate",
      },
    });
  } catch (error) {
    console.error(
      "Platform settings API error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "حدث خطأ غير متوقع أثناء تحميل إعدادات المنصة.",

        details:
          error instanceof Error
            ? error.message
            : "Unknown server error",
      },
      {
        status: 500,
        headers: {
          "Cache-Control":
            "no-store, no-cache, must-revalidate",
        },
      }
    );
  }
}