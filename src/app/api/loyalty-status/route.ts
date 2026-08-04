import { NextRequest, NextResponse } from "next/server";

import { createAdminClient } from "../../../lib/supabase/admin";

type LoyaltySummaryRow = {
  phone: string;
  customer_name: string | null;

  loyalty_enabled: boolean;
  required_orders: number;

  discount_type: "percentage" | "fixed";
  discount_value: number;

  loyalty_progress: number;
  remaining_orders: number;
  reward_ready: boolean;
};

function normalizePhone(value: unknown) {
  return String(value ?? "")
    .trim()
    .replace(/[^\d]/g, "");
}

export async function GET(
  request: NextRequest
) {
  try {
    const phone = normalizePhone(
      request.nextUrl.searchParams.get(
        "phone"
      )
    );

    if (!phone) {
      return NextResponse.json(
        {
          error: "رقم الهاتف مطلوب.",
        },
        {
          status: 400,
        }
      );
    }

    if (phone.length < 10) {
      return NextResponse.json(
        {
          error:
            "يرجى كتابة رقم هاتف صحيح.",
        },
        {
          status: 400,
        }
      );
    }

    const supabase =
      createAdminClient();

    const {
      data: settings,
      error: settingsError,
    } = await supabase
      .from("platform_settings")
      .select(
        `
          loyalty_enabled,
          loyalty_required_orders,
          loyalty_discount_type,
          loyalty_discount_value
        `
      )
      .eq("id", 1)
      .maybeSingle();

    if (settingsError) {
      console.error(
        "Loyalty settings error:",
        settingsError
      );

      return NextResponse.json(
        {
          error:
            "تعذر تحميل إعدادات الولاء.",
          details:
            settingsError.message,
        },
        {
          status: 500,
        }
      );
    }

    const loyaltyEnabled =
      settings?.loyalty_enabled ===
      true;

    const requiredOrders =
      Math.max(
        1,
        Number(
          settings?.loyalty_required_orders ??
            5
        )
      );

    const discountType =
      settings?.loyalty_discount_type ===
      "fixed"
        ? "fixed"
        : "percentage";

    const discountValue =
      Math.max(
        0,
        Number(
          settings?.loyalty_discount_value ??
            0
        )
      );

    if (!loyaltyEnabled) {
      return NextResponse.json({
        found: false,
        enabled: false,

        phone,

        progress: 0,
        required: requiredOrders,
        remaining: requiredOrders,

        reward_ready: false,

        discount_type:
          discountType,

        discount_value:
          discountValue,
      });
    }

    const {
      data: customer,
      error: customerError,
    } = await supabase
      .from(
        "customer_loyalty_summary"
      )
      .select(
        `
          phone,
          customer_name,
          loyalty_enabled,
          required_orders,
          discount_type,
          discount_value,
          loyalty_progress,
          remaining_orders,
          reward_ready
        `
      )
      .eq("phone", phone)
      .maybeSingle();

    if (customerError) {
      console.error(
        "Customer loyalty error:",
        customerError
      );

      return NextResponse.json(
        {
          error:
            "تعذر تحميل حالة الولاء.",
          details:
            customerError.message,
        },
        {
          status: 500,
        }
      );
    }

    if (!customer) {
      return NextResponse.json({
        found: false,
        enabled: true,

        phone,

        customer_name: null,

        progress: 0,
        required:
          requiredOrders,

        remaining:
          requiredOrders,

        reward_ready: false,

        discount_type:
          discountType,

        discount_value:
          discountValue,
      });
    }

    const row =
      customer as LoyaltySummaryRow;

    return NextResponse.json({
      found: true,
      enabled:
        row.loyalty_enabled,

      phone: row.phone,

      customer_name:
        row.customer_name,

      progress: Number(
        row.loyalty_progress ?? 0
      ),

      required: Number(
        row.required_orders ??
          requiredOrders
      ),

      remaining: Number(
        row.remaining_orders ??
          requiredOrders
      ),

      reward_ready:
        row.reward_ready === true,

      discount_type:
        row.discount_type,

      discount_value: Number(
        row.discount_value ?? 0
      ),
    });
  } catch (error) {
    console.error(
      "Loyalty status API error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "حدث خطأ أثناء التحقق من الولاء.",

        details:
          error instanceof Error
            ? error.message
            : "Unknown loyalty error",
      },
      {
        status: 500,
      }
    );
  }
}