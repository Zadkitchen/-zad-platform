import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type OrderStatus =
  | "new"
  | "accepted"
  | "preparing"
  | "ready"
  | "delivered"
  | "cancelled";

type TelegramButton = {
  text: string;
  callback_data: string;
};

type TelegramReplyMarkup = {
  inline_keyboard: TelegramButton[][];
};

type TelegramCallbackQuery = {
  id: string;
  data?: string;
  message?: {
    message_id: number;
    chat: {
      id: number;
    };
    text?: string;
  };
};

type TelegramUpdate = {
  callback_query?: TelegramCallbackQuery;
};

type OrderRow = {
  id: string;
  status: string;
  order_number: number | null;
  loyalty_applied: boolean | null;
  customer_phone_normalized: string | null;
};

function getTelegramApi() {
  const token = process.env.TELEGRAM_BOT_TOKEN;

  if (!token) {
    throw new Error(
      "TELEGRAM_BOT_TOKEN غير موجود في متغيرات البيئة."
    );
  }

  return `https://api.telegram.org/bot${token}`;
}

function getStatusLabel(status: OrderStatus): string {
  const labels: Record<OrderStatus, string> = {
    new: "🟡 بانتظار القبول",
    accepted: "✅ تم قبول الطلب",
    preparing: "🍳 جاري التحضير",
    ready: "🚗 جاهز للتوصيل",
    delivered: "🎉 تم تسليم الطلب",
    cancelled: "❌ تم إلغاء الطلب",
  };

  return labels[status];
}

function getOrderKeyboard(
  orderId: string,
  status: OrderStatus
): TelegramReplyMarkup | undefined {
  switch (status) {
    case "new":
      return {
        inline_keyboard: [
          [
            {
              text: "✅ قبول الطلب",
              callback_data: `order:accepted:${orderId}`,
            },
            {
              text: "❌ إلغاء الطلب",
              callback_data: `order:cancelled:${orderId}`,
            },
          ],
        ],
      };

    case "accepted":
      return {
        inline_keyboard: [
          [
            {
              text: "🍳 بدء التحضير",
              callback_data: `order:preparing:${orderId}`,
            },
          ],
          [
            {
              text: "❌ إلغاء الطلب",
              callback_data: `order:cancelled:${orderId}`,
            },
          ],
        ],
      };

    case "preparing":
      return {
        inline_keyboard: [
          [
            {
              text: "🚗 جاهز للتوصيل",
              callback_data: `order:ready:${orderId}`,
            },
          ],
          [
            {
              text: "❌ إلغاء الطلب",
              callback_data: `order:cancelled:${orderId}`,
            },
          ],
        ],
      };

    case "ready":
      return {
        inline_keyboard: [
          [
            {
              text: "🎉 تم التسليم",
              callback_data: `order:delivered:${orderId}`,
            },
          ],
          [
            {
              text: "❌ إلغاء الطلب",
              callback_data: `order:cancelled:${orderId}`,
            },
          ],
        ],
      };

    case "delivered":
    case "cancelled":
      return undefined;
  }
}

function isOrderStatus(value: string): value is OrderStatus {
  return [
    "new",
    "accepted",
    "preparing",
    "ready",
    "delivered",
    "cancelled",
  ].includes(value);
}

function isValidTransition(
  currentStatus: OrderStatus,
  nextStatus: OrderStatus
): boolean {
  if (nextStatus === "cancelled") {
    return !["delivered", "cancelled"].includes(currentStatus);
  }

  const transitions: Partial<Record<OrderStatus, OrderStatus>> = {
    new: "accepted",
    accepted: "preparing",
    preparing: "ready",
    ready: "delivered",
  };

  return transitions[currentStatus] === nextStatus;
}

function updateStatusInMessage(
  originalText: string,
  status: OrderStatus
): string {
  const statusLine = `📌 <b>حالة الطلب:</b> ${getStatusLabel(status)}`;

  const htmlStatusPattern = /\n*[🟡✅🍳🚗🎉❌]?\s*<b>الحالة:<\/b>[^\n]*$/;
  const plainStatusPattern = /\n*📌\s*(?:<b>)?حالة الطلب:(?:<\/b>)?[^\n]*$/;

  if (htmlStatusPattern.test(originalText)) {
    return originalText.replace(
      htmlStatusPattern,
      `\n\n${statusLine}`
    );
  }

  if (plainStatusPattern.test(originalText)) {
    return originalText.replace(
      plainStatusPattern,
      `\n\n${statusLine}`
    );
  }

  return `${originalText}\n\n${statusLine}`;
}

async function telegramRequest(
  method: string,
  body: Record<string, unknown>
) {
  const telegramApi = getTelegramApi();

  const response = await fetch(`${telegramApi}/${method}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  const result = await response.json();

  if (!response.ok || !result.ok) {
    throw new Error(
      `Telegram ${method} failed: ${JSON.stringify(result)}`
    );
  }

  return result;
}

async function answerCallbackQuery(
  callbackQueryId: string,
  text: string,
  showAlert = false
) {
  return telegramRequest("answerCallbackQuery", {
    callback_query_id: callbackQueryId,
    text,
    show_alert: showAlert,
    cache_time: 0,
  });
}

async function editTelegramOrderMessage(params: {
  chatId: number;
  messageId: number;
  text: string;
  replyMarkup?: TelegramReplyMarkup;
}) {
  return telegramRequest("editMessageText", {
    chat_id: params.chatId,
    message_id: params.messageId,
    text: params.text,
    parse_mode: "HTML",
    disable_web_page_preview: true,
    reply_markup: params.replyMarkup ?? {
      inline_keyboard: [],
    },
  });
}

export async function POST(request: NextRequest) {
  let callbackQueryId: string | undefined;
  let callbackAnswered = false;

  try {
    const update = (await request.json()) as TelegramUpdate;
    const callbackQuery = update.callback_query;

    if (!callbackQuery) {
      return NextResponse.json({
        ok: true,
        ignored: true,
      });
    }

    callbackQueryId = callbackQuery.id;

    const callbackData = callbackQuery.data;
    const telegramMessage = callbackQuery.message;

    if (!callbackData || !telegramMessage) {
      await answerCallbackQuery(
        callbackQuery.id,
        "تعذر قراءة بيانات الطلب.",
        true
      );

      return NextResponse.json({
        ok: true,
        ignored: true,
      });
    }

    const [entity, requestedStatus, orderId] =
      callbackData.split(":");

    if (
      entity !== "order" ||
      !requestedStatus ||
      !orderId ||
      !isOrderStatus(requestedStatus)
    ) {
      await answerCallbackQuery(
        callbackQuery.id,
        "هذا الزر غير صالح.",
        true
      );

      return NextResponse.json({
        ok: true,
        ignored: true,
      });
    }

    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL;

    const serviceRoleKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error(
        "Supabase server environment variables are missing."
      );
    }

    const supabase = createClient(
      supabaseUrl,
      serviceRoleKey,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    );

    const { data: orderData, error: findError } =
      await supabase
        .from("orders")
        .select(
          `
            id,
            status,
            order_number,
            loyalty_applied,
            customer_phone_normalized
          `
        )
        .eq("id", orderId)
        .single();

    const order = orderData as OrderRow | null;

    if (findError || !order) {
      await answerCallbackQuery(
        callbackQuery.id,
        "الطلب غير موجود في النظام.",
        true
      );

      return NextResponse.json({
        ok: true,
        orderFound: false,
      });
    }

    const currentStatus = order.status as OrderStatus;
    const nextStatus = requestedStatus;

    if (!isOrderStatus(currentStatus)) {
      await answerCallbackQuery(
        callbackQuery.id,
        `حالة الطلب الحالية غير مدعومة: ${String(order.status)}`,
        true
      );

      return NextResponse.json({
        ok: true,
        invalidCurrentStatus: true,
      });
    }

    if (currentStatus === nextStatus) {
      await answerCallbackQuery(
        callbackQuery.id,
        "الطلب موجود بهذه الحالة مسبقًا."
      );

      return NextResponse.json({
        ok: true,
        unchanged: true,
      });
    }

    if (!isValidTransition(currentStatus, nextStatus)) {
      await answerCallbackQuery(
        callbackQuery.id,
        "لا يمكن نقل الطلب إلى هذه الحالة الآن.",
        true
      );

      return NextResponse.json({
        ok: true,
        invalidTransition: true,
      });
    }

    // يوقف دوران زر تيليجرام بسرعة، ثم نكمل التحديث.
    await answerCallbackQuery(
      callbackQuery.id,
      "جاري تحديث حالة الطلب..."
    );
    callbackAnswered = true;

    const { data: updatedOrder, error: updateError } =
      await supabase
        .from("orders")
        .update({
          status: nextStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", orderId)
        .eq("status", currentStatus)
        .select("id, status")
        .maybeSingle();

    if (updateError) {
      throw new Error(
        `Supabase order update failed: ${updateError.message}`
      );
    }

    if (!updatedOrder) {
      return NextResponse.json({
        ok: true,
        unchangedByConcurrency: true,
      });
    }

    /*
     * لا نحتاج تصفير عداد الولاء هنا.
     * نظام الولاء في /api/orders يعتمد على:
     * 1) الطلبات delivered غير المخفّضة بعد آخر طلب مكافأة delivered.
     * 2) loyalty_applied لتمييز طلب المكافأة.
     * لذلك مجرد تحويل الحالة إلى delivered يكفي لبدء/إكمال الدورة تلقائيًا.
     */

    const updatedMessage = updateStatusInMessage(
      telegramMessage.text ??
        `طلب رقم: #${order.order_number ?? orderId}`,
      nextStatus
    );

    await editTelegramOrderMessage({
      chatId: telegramMessage.chat.id,
      messageId: telegramMessage.message_id,
      text: updatedMessage,
      replyMarkup: getOrderKeyboard(orderId, nextStatus),
    });

    return NextResponse.json({
      ok: true,
      orderId,
      orderNumber: order.order_number,
      previousStatus: currentStatus,
      status: nextStatus,
      loyaltyApplied: order.loyalty_applied === true,
      loyaltyCycleUpdated: nextStatus === "delivered",
    });
  } catch (error) {
    console.error("Telegram webhook error:", error);

    if (callbackQueryId && !callbackAnswered) {
      try {
        await answerCallbackQuery(
          callbackQueryId,
          "حدث خطأ أثناء تحديث الطلب.",
          true
        );
      } catch (callbackError) {
        console.error(
          "Telegram callback response error:",
          callbackError
        );
      }
    }

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown webhook error",
      },
      {
        status: 500,
      }
    );
  }
}