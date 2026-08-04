import {
  NextRequest,
  NextResponse,
} from "next/server";

import { createAdminClient } from "../../../lib/supabase/admin";

type LoyaltySettingsRow = {
  loyalty_enabled: boolean | null;
  loyalty_required_orders: number | null;
  loyalty_discount_type: string | null;
  loyalty_discount_value: number | null;
};

type CustomerNameRow = {
  customer_name: string | null;
};

type LastRewardRow = {
  created_at: string;
};

function normalizePhone(value: unknown) {
  return String(value ?? "")
    .trim()
    .replace(/[^\d]/g, "");
}

function cleanNumber(
  value: unknown,
  fallback = 0
) {
  const number = Number(value);

  if (!Number.isFinite(number) || number < 0) {
    return fallback;
  }

  return Math.round(number);
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

    /*
     * 1. جلب إعدادات برنامج الولاء.
     */
    const {
      data: settingsData,
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

    const settings =
      (settingsData ??
        null) as LoyaltySettingsRow | null;

    const loyaltyEnabled =
      settings?.loyalty_enabled === true;

    const requiredOrders = Math.max(
      1,
      cleanNumber(
        settings?.loyalty_required_orders,
        5
      ) || 5
    );

    const discountType:
      | "percentage"
      | "fixed" =
      settings?.loyalty_discount_type ===
      "fixed"
        ? "fixed"
        : "percentage";

    const rawDiscountValue =
      cleanNumber(
        settings?.loyalty_discount_value
      );

    const discountValue =
      discountType === "percentage"
        ? Math.min(
            100,
            rawDiscountValue
          )
        : rawDiscountValue;

    if (!loyaltyEnabled) {
      return NextResponse.json({
        found: false,
        enabled: false,

        phone,
        customer_name: null,

        progress: 0,
        required: requiredOrders,
        remaining: requiredOrders,

        reward_ready: false,
        reward_in_use: false,

        discount_type:
          discountType,

        discount_value:
          discountValue,
      });
    }

    /*
     * 2. جلب آخر اسم مستخدم لهذا الرقم.
     */
    const {
      data: customerData,
      error: customerError,
    } = await supabase
      .from("orders")
      .select("customer_name")
      .eq(
        "customer_phone_normalized",
        phone
      )
      .order("created_at", {
        ascending: false,
      })
      .limit(1)
      .maybeSingle();

    if (customerError) {
      console.error(
        "Customer lookup error:",
        customerError
      );

      return NextResponse.json(
        {
          error:
            "تعذر تحميل بيانات الزبون.",

          details:
            customerError.message,
        },
        {
          status: 500,
        }
      );
    }

    const customer =
      (customerData ??
        null) as CustomerNameRow | null;

    /*
     * 3. فحص وجود طلب مكافأة جارٍ.
     *
     * إذا كانت المكافأة مطبقة على طلب حالته:
     * new / accepted / preparing / ready
     *
     * فهذا يعني أن المكافأة مستخدمة حاليًا،
     * ولا يجب أن تظهر كأنها جاهزة مرة ثانية.
     */
    const {
      count: activeRewardCount,
      error: activeRewardError,
    } = await supabase
      .from("orders")
      .select("*", {
        count: "exact",
        head: true,
      })
      .eq(
        "customer_phone_normalized",
        phone
      )
      .eq("loyalty_applied", true)
      .in("status", [
        "new",
        "accepted",
        "preparing",
        "ready",
      ]);

    if (activeRewardError) {
      console.error(
        "Active reward lookup error:",
        activeRewardError
      );

      return NextResponse.json(
        {
          error:
            "تعذر التحقق من مكافأة الولاء.",

          details:
            activeRewardError.message,
        },
        {
          status: 500,
        }
      );
    }

    const rewardInUse =
      (activeRewardCount ?? 0) > 0;

    /*
     * 4. جلب آخر طلب مكافأة تم تسليمه.
     *
     * الطلبات العادية بعد هذا التاريخ فقط
     * تدخل ضمن دورة الولاء الجديدة.
     */
    const {
      data: lastRewardData,
      error: lastRewardError,
    } = await supabase
      .from("orders")
      .select("created_at")
      .eq(
        "customer_phone_normalized",
        phone
      )
      .eq("status", "delivered")
      .eq("loyalty_applied", true)
      .order("created_at", {
        ascending: false,
      })
      .limit(1)
      .maybeSingle();

    if (lastRewardError) {
      console.error(
        "Last delivered reward error:",
        lastRewardError
      );

      return NextResponse.json(
        {
          error:
            "تعذر حساب دورة الولاء.",

          details:
            lastRewardError.message,
        },
        {
          status: 500,
        }
      );
    }

    const lastReward =
      (lastRewardData ??
        null) as LastRewardRow | null;

    /*
     * 5. حساب الطلبات العادية المسلّمة
     * بعد آخر مكافأة مسلّمة.
     */
    let completedOrdersQuery =
      supabase
        .from("orders")
        .select("*", {
          count: "exact",
          head: true,
        })
        .eq(
          "customer_phone_normalized",
          phone
        )
        .eq("status", "delivered")
        .eq(
          "loyalty_applied",
          false
        );

    if (lastReward?.created_at) {
      completedOrdersQuery =
        completedOrdersQuery.gt(
          "created_at",
          lastReward.created_at
        );
    }

    const {
      count: completedOrdersCount,
      error: completedOrdersError,
    } = await completedOrdersQuery;

    if (completedOrdersError) {
      console.error(
        "Completed loyalty orders error:",
        completedOrdersError
      );

      return NextResponse.json(
        {
          error:
            "تعذر حساب تقدم الولاء.",

          details:
            completedOrdersError.message,
        },
        {
          status: 500,
        }
      );
    }

    const completedOrders =
      completedOrdersCount ?? 0;

    /*
     * لا نخلي التقدم يتجاوز العدد المطلوب.
     */
    const progress = Math.min(
      completedOrders,
      requiredOrders
    );

    const remaining = Math.max(
      0,
      requiredOrders - progress
    );

    /*
     * المكافأة جاهزة فقط إذا:
     *
     * - عدد الطلبات وصل للحد المطلوب.
     * - لا يوجد طلب مكافأة جارٍ.
     */
    const rewardReady =
      completedOrders >= requiredOrders &&
      !rewardInUse;

    return NextResponse.json({
      found: Boolean(customer),

      enabled: true,

      phone,

      customer_name:
        customer?.customer_name ??
        null,

      progress,

      required:
        requiredOrders,

      remaining,

      reward_ready:
        rewardReady,

      reward_in_use:
        rewardInUse,

      discount_type:
        discountType,

      discount_value:
        discountValue,
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