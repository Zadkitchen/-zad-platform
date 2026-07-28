import { NextResponse } from "next/server";

import { createAdminClient } from "../../../lib/supabase/admin";

type OrderItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  size?: string | null;
  note?: string | null;
};

type CreateOrderBody = {
  customer_name?: string;
  customer_phone?: string;
  customer_address?: string;
  customer_note?: string;

  subtotal?: number;
  delivery_fee?: number;
  total?: number;

  whatsapp_number?: string;
  items?: OrderItem[];
};

function cleanText(value: unknown) {
  return String(value ?? "").trim();
}

function cleanNumber(value: unknown) {
  const number = Number(value);

  if (!Number.isFinite(number) || number < 0) {
    return 0;
  }

  return Math.round(number);
}

export async function POST(request: Request) {
  try {
    const body =
      (await request.json()) as CreateOrderBody;

    const customerName = cleanText(
      body.customer_name
    );

    const customerPhone = cleanText(
      body.customer_phone
    );

    const customerAddress = cleanText(
      body.customer_address
    );

    const customerNote = cleanText(
      body.customer_note
    );

    const subtotal = cleanNumber(body.subtotal);
    const deliveryFee = cleanNumber(
      body.delivery_fee
    );
    const total = cleanNumber(body.total);

    const whatsappNumber = cleanText(
      body.whatsapp_number
    ).replace(/[^\d]/g, "");

    const items = Array.isArray(body.items)
      ? body.items
          .map((item) => ({
            id: cleanText(item.id),
            name: cleanText(item.name),
            price: cleanNumber(item.price),
            quantity: Math.max(
              1,
              cleanNumber(item.quantity)
            ),
            size: cleanText(item.size) || null,
            note: cleanText(item.note) || null,
          }))
          .filter(
            (item) =>
              item.id &&
              item.name &&
              item.quantity > 0
          )
      : [];

    if (!customerName) {
      return NextResponse.json(
        {
          error: "اسم الزبون مطلوب.",
        },
        {
          status: 400,
        }
      );
    }

    if (!customerPhone) {
      return NextResponse.json(
        {
          error: "رقم الهاتف مطلوب.",
        },
        {
          status: 400,
        }
      );
    }

    if (!customerAddress) {
      return NextResponse.json(
        {
          error: "عنوان التوصيل مطلوب.",
        },
        {
          status: 400,
        }
      );
    }

    if (items.length === 0) {
      return NextResponse.json(
        {
          error: "لا توجد أصناف داخل الطلب.",
        },
        {
          status: 400,
        }
      );
    }

    if (subtotal <= 0 || total <= 0) {
      return NextResponse.json(
        {
          error: "قيمة الطلب غير صحيحة.",
        },
        {
          status: 400,
        }
      );
    }

    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from("orders")
      .insert({
        customer_name: customerName,
        customer_phone: customerPhone,
        customer_address: customerAddress,
        customer_note: customerNote,

        subtotal,
        delivery_fee: deliveryFee,
        total,

        status: "new",
        source: "website",

        whatsapp_number: whatsappNumber,
        items,
      })
      .select("id, status, created_at")
      .single();

    if (error) {
      console.error(
        "Order insert error:",
        JSON.stringify(error, null, 2)
      );

      return NextResponse.json(
        {
          error: "تعذر حفظ الطلب.",
          details: error.message,
        },
        {
          status: 500,
        }
      );
    }

    return NextResponse.json(
      {
        success: true,
        order: data,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "Create order API error:",
      error
    );

    const message =
      error instanceof Error
        ? error.message
        : "Unknown server error";

    return NextResponse.json(
      {
        error:
          "حدث خطأ غير متوقع أثناء إنشاء الطلب.",
        details: message,
      },
      {
        status: 500,
      }
    );
  }
}