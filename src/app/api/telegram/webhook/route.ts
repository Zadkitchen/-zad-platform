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

const TELEGRAM_API = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`;

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
  const statusLine = `📌 حالة الطلب: ${getStatusLabel(status)}`;

  const statusPattern = /\n*📌 حالة الطلب:[\s\S]*$/;

  if (statusPattern.test(originalText)) {
    return originalText.replace(statusPattern, `\n\n${statusLine}`);
  }

  return `${originalText}\n\n${statusLine}`;
}

async function telegramRequest(
  method: string,
  body: Record<string, unknown>
) {
  const response = await fetch(`${TELEGRAM_API}/${method}`, {
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
    reply_markup: params.replyMarkup ?? {
      inline_keyboard: [],
    },
  });
}

export async function POST(request: NextRequest) {
  let callbackQueryId: string | undefined;

  try {
    const expectedSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
    const receivedSecret = request.headers.get(
      "x-telegram-bot-api-secret-token"
    );

    if (expectedSecret && receivedSecret !== expectedSecret) {
      return NextResponse.json(
        {
          ok: false,
          error: "Unauthorized webhook request",
        },
        {
          status: 401,
        }
      );
    }

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

    const { data: order, error: findError } = await supabase
      .from("orders")
      .select("id, status")
      .eq("id", orderId)
      .single();

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
        `حالة الطلب الحالية غير مدعومة: ${String(
          order.status
        )}`,
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

    const { error: updateError } = await supabase
      .from("orders")
      .update({
        status: nextStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId)
      .eq("status", currentStatus);

    if (updateError) {
      throw new Error(
        `Supabase order update failed: ${updateError.message}`
      );
    }

    const updatedMessage = updateStatusInMessage(
      telegramMessage.text ?? `طلب رقم: ${orderId}`,
      nextStatus
    );

    await editTelegramOrderMessage({
      chatId: telegramMessage.chat.id,
      messageId: telegramMessage.message_id,
      text: updatedMessage,
      replyMarkup: getOrderKeyboard(orderId, nextStatus),
    });

    await answerCallbackQuery(
      callbackQuery.id,
      getStatusLabel(nextStatus)
    );

    return NextResponse.json({
      ok: true,
      orderId,
      previousStatus: currentStatus,
      status: nextStatus,
    });
  } catch (error) {
    console.error("Telegram webhook error:", error);

    if (callbackQueryId) {
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