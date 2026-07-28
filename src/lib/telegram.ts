const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

function getTelegramConfig() {
  if (!BOT_TOKEN) {
    throw new Error(
      "TELEGRAM_BOT_TOKEN غير موجود في متغيرات البيئة."
    );
  }

  if (!CHAT_ID) {
    throw new Error(
      "TELEGRAM_CHAT_ID غير موجود في متغيرات البيئة."
    );
  }

  return {
    apiUrl: `https://api.telegram.org/bot${BOT_TOKEN}`,
    chatId: CHAT_ID,
  };
}

type TelegramReplyMarkup = {
  inline_keyboard?: Array<
    Array<{
      text: string;
      callback_data?: string;
      url?: string;
    }>
  >;
};

type TelegramApiResponse<T> = {
  ok: boolean;
  result?: T;
  description?: string;
};

type TelegramMessage = {
  message_id: number;
};

export async function sendTelegramMessage(
  text: string,
  replyMarkup?: TelegramReplyMarkup
) {
  const { apiUrl, chatId } = getTelegramConfig();

  const response = await fetch(
    `${apiUrl}/sendMessage`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: true,
        ...(replyMarkup
          ? { reply_markup: replyMarkup }
          : {}),
      }),
      cache: "no-store",
    }
  );

  const result =
    (await response.json()) as TelegramApiResponse<TelegramMessage>;

  if (!response.ok || !result.ok) {
    throw new Error(
      result.description ||
        "فشل إرسال رسالة تيليجرام."
    );
  }

  return result.result;
}

export async function editTelegramMessage(
  messageId: number,
  text: string,
  replyMarkup?: TelegramReplyMarkup
) {
  const { apiUrl, chatId } = getTelegramConfig();

  const response = await fetch(
    `${apiUrl}/editMessageText`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: chatId,
        message_id: messageId,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: true,
        ...(replyMarkup
          ? { reply_markup: replyMarkup }
          : {}),
      }),
      cache: "no-store",
    }
  );

  const result =
    (await response.json()) as TelegramApiResponse<TelegramMessage>;

  if (!response.ok || !result.ok) {
    throw new Error(
      result.description ||
        "فشل تعديل رسالة تيليجرام."
    );
  }

  return result.result;
}

type TelegramOrderItem = {
  name: string;
  quantity: number;
  price: number;
  size?: string | null;
  note?: string | null;
};

type TelegramOrder = {
  id: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  customer_note?: string | null;
  subtotal: number;
  delivery_fee: number;
  total: number;
  items: TelegramOrderItem[];
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function formatPrice(value: number) {
  return new Intl.NumberFormat("ar-US").format(
    value
  );
}
export type OrderStatus =
  | "new"
  | "accepted"
  | "preparing"
  | "ready"
  | "delivered"
  | "cancelled";

export function getOrderStatusLabel(
  status: OrderStatus
) {
  const labels: Record<OrderStatus, string> = {
    new: "🟡 بانتظار القبول",
    accepted: "✅ تم قبول الطلب",
    preparing: "🍳 جاري التحضير",
    ready: "🚗 جاهز للتوصيل",
    delivered: "🎉 تم التسليم",
    cancelled: "❌ تم إلغاء الطلب",
  };

  return labels[status];
}

export function getOrderKeyboard(
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
export async function sendNewOrderNotification(
  order: TelegramOrder
) {
  const itemsText = order.items
    .map((item) => {
      const name = escapeHtml(item.name);

      const size = item.size
        ? ` (${escapeHtml(item.size)})`
        : "";

      const note = item.note
        ? `\n📝 الملاحظة: ${escapeHtml(
            item.note
          )}`
        : "";

      const itemTotal =
        item.price * item.quantity;

      return (
        `• ${name}${size} × ${item.quantity}` +
        `\n💵 ${formatPrice(itemTotal)} د.ع` +
        note
      );
    })
    .join("\n\n");

  const customerNote = order.customer_note
    ? `\n📝 <b>ملاحظة الطلب:</b> ${escapeHtml(
        order.customer_note
      )}\n`
    : "";

  const message = [
    "🔔 <b>طلب جديد من منصة زاد</b>",
    "",
    `🆔 <b>رقم الطلب:</b> #${escapeHtml(
      order.id.slice(0, 8).toUpperCase()
    )}`,
    "",
    `👤 <b>الزبون:</b> ${escapeHtml(
      order.customer_name
    )}`,
    `📞 <b>الهاتف:</b> ${escapeHtml(
      order.customer_phone
    )}`,
    `📍 <b>العنوان:</b> ${escapeHtml(
      order.customer_address
    )}`,
    customerNote,
    "━━━━━━━━━━━━━━",
    "<b>تفاصيل الطلب</b>",
    "",
    itemsText,
    "",
    "━━━━━━━━━━━━━━",
    `🧾 <b>قيمة الوجبات:</b> ${formatPrice(
      order.subtotal
    )} د.ع`,
    `🚗 <b>التوصيل:</b> ${formatPrice(
      order.delivery_fee
    )} د.ع`,
    `💰 <b>الإجمالي:</b> ${formatPrice(
      order.total
    )} د.ع`,
    "",
    "🟡 <b>الحالة:</b> بانتظار القبول",
  ].join("\n");

  return sendTelegramMessage(
  message,
  getOrderKeyboard(order.id, "new")
);
}