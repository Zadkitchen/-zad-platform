import {
  NextRequest,
  NextResponse,
} from "next/server";

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
  reward_in_use: boolean;
};

function normalizePhone(value: unknown) {
  return String(value ?? "")
    .trim()
    .replace(/[^\d]/g, "");
}

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(
  request: NextRequest
) {
  try {
    const phone = normalizePhone(
      request.nextUrl.searchParams.get("phone")
    );

    if (phone.length < 10) {
      return NextResponse.json(
        {
          error:
            "يرجى كتابة رقم هاتف صحيح.",
        },
        {
          status: 400,
          headers: {
            "Cache-Control":
              "no-store, no-cache, must-revalidate",
          },
        }
      );
    }

    const supabase = createAdminClient();

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
      throw settingsError;
    }

    const enabled =
      settings?.loyalty_enabled === true;

    const required = Math.max(
      1,
      Number(
        settings?.loyalty_required_orders ?? 5
      )
    );

    const discountType:
      | "percentage"
      | "fixed" =
      settings?.loyalty_discount_type ===
      "fixed"
        ? "fixed"
        : "percentage";

    const discountValue = Math.max(
      0,
      Number(
        settings?.loyalty_discount_value ?? 0
      )
    );

    const {
      data,
      error,
    } = await supabase
      .from("customer_loyalty_summary")
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
          reward_ready,
          reward_in_use
        `
      )
      .eq("phone", phone)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      return NextResponse.json(
        {
          found: false,
          enabled,
          phone,
          customer_name: null,
          progress: 0,
          required,
          remaining: required,
          reward_ready: false,
          reward_in_use: false,
          discount_type: discountType,
          discount_value: discountValue,
        },
        {
          headers: {
            "Cache-Control":
              "no-store, no-cache, must-revalidate",
          },
        }
      );
    }

    const row = data as LoyaltySummaryRow;

    return NextResponse.json(
      {
        found: true,
        enabled: row.loyalty_enabled,
        phone: row.phone,
        customer_name: row.customer_name,
        progress: Number(
          row.loyalty_progress ?? 0
        ),
        required: Number(
          row.required_orders ?? required
        ),
        remaining: Number(
          row.remaining_orders ?? required
        ),
        reward_ready:
          row.reward_ready === true,
        reward_in_use:
          row.reward_in_use === true,
        discount_type:
          row.discount_type,
        discount_value: Number(
          row.discount_value ?? 0
        ),
      },
      {
        headers: {
          "Cache-Control":
            "no-store, no-cache, must-revalidate",
        },
      }
    );
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
        headers: {
          "Cache-Control":
            "no-store, no-cache, must-revalidate",
        },
      }
    );
  }
}