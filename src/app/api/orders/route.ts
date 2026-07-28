import { NextResponse } from "next/server";

import { createAdminClient } from "../../../lib/supabase/admin";
import { sendNewOrderNotification } from "../../../lib/telegram";

const KITCHEN_LATITUDE = 30.4745625;
const KITCHEN_LONGITUDE = 47.8055625;

const DELIVERY_STEP_KM = 5;
const DELIVERY_STEP_PRICE = 1000;
const MAX_DELIVERY_DISTANCE_KM = 20;

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

  customer_latitude?: number;
  customer_longitude?: number;

  subtotal?: number;
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

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

function calculateDistanceKm(
  latitude1: number,
  longitude1: number,
  latitude2: number,
  longitude2: number
) {
  const earthRadiusKm = 6371;

  const latitudeDifference = toRadians(
    latitude2 - latitude1
  );

  const longitudeDifference = toRadians(
    longitude2 - longitude1
  );

  const startLatitude = toRadians(latitude1);
  const endLatitude = toRadians(latitude2);

  const haversine =
    Math.sin(latitudeDifference / 2) ** 2 +
    Math.cos(startLatitude) *
      Math.cos(endLatitude) *
      Math.sin(longitudeDifference / 2) ** 2;

  return (
    2 *
    earthRadiusKm *
    Math.atan2(
      Math.sqrt(haversine),
      Math.sqrt(1 - haversine)
    )
  );
}

function calculateDeliveryFee(distanceKm: number) {
  const deliverySteps = Math.max(
    1,
    Math.ceil(distanceKm / DELIVERY_STEP_KM)
  );

  return deliverySteps * DELIVERY_STEP_PRICE;
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

    const customerLatitude = Number(
      body.customer_latitude
    );

    const customerLongitude = Number(
      body.customer_longitude
    );

    const subtotal = cleanNumber(body.subtotal);

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
        { error: "اسم الزبون مطلوب." },
        { status: 400 }
      );
    }

    if (!customerPhone) {
      return NextResponse.json(
        { error: "رقم الهاتف مطلوب." },
        { status: 400 }
      );
    }

    if (!customerAddress) {
      return NextResponse.json(
        { error: "عنوان التوصيل مطلوب." },
        { status: 400 }
      );
    }

    if (
      !Number.isFinite(customerLatitude) ||
      !Number.isFinite(customerLongitude)
    ) {
      return NextResponse.json(
        {
          error:
            "يرجى الضغط على زر تحديد موقعي قبل إرسال الطلب.",
        },
        { status: 400 }
      );
    }

    if (items.length === 0) {
      return NextResponse.json(
        { error: "لا توجد أصناف داخل الطلب." },
        { status: 400 }
      );
    }

    if (subtotal <= 0) {
      return NextResponse.json(
        { error: "قيمة الطلب غير صحيحة." },
        { status: 400 }
      );
    }

    const distanceKm = calculateDistanceKm(
      KITCHEN_LATITUDE,
      KITCHEN_LONGITUDE,
      customerLatitude,
      customerLongitude
    );

    if (distanceKm > MAX_DELIVERY_DISTANCE_KM) {
      return NextResponse.json(
        {
          error: `عذرًا، موقع التوصيل يبعد ${distanceKm.toFixed(
            1
          )} كم، والحد الأقصى للتوصيل هو ${MAX_DELIVERY_DISTANCE_KM} كم.`,
        },
        { status: 400 }
      );
    }

    const deliveryFee =
      calculateDeliveryFee(distanceKm);

    const total = subtotal + deliveryFee;

    const mapsUrl =
      `https://www.google.com/maps?q=` +
      `${customerLatitude},${customerLongitude}`;

    const fullAddress =
      `${customerAddress}\n` +
      `📍 الموقع: ${mapsUrl}\n` +
      `📏 المسافة التقريبية: ${distanceKm.toFixed(
        1
      )} كم`;

    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from("orders")
      .insert({
        customer_name: customerName,
        customer_phone: customerPhone,
        customer_address: fullAddress,
        customer_note: customerNote,

        subtotal,
        delivery_fee: deliveryFee,
        total,

        status: "new",
        source: "website",

        whatsapp_number: whatsappNumber,
        items,
      })
      .select(
        "id, status, created_at, delivery_fee, total"
      )
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
        { status: 500 }
      );
    }

    try {
      await sendNewOrderNotification({
        id: data.id,
        customer_name: customerName,
        customer_phone: customerPhone,
        customer_address: fullAddress,
        customer_note: customerNote,
        subtotal,
        delivery_fee: deliveryFee,
        total,
        items,
      });
    } catch (telegramError) {
      console.error(
        "Telegram notification error:",
        telegramError
      );
    }

    return NextResponse.json(
      {
        success: true,
        order: data,
        delivery: {
          distance_km: Number(
            distanceKm.toFixed(1)
          ),
          delivery_fee: deliveryFee,
          total,
          latitude: customerLatitude,
          longitude: customerLongitude,
          maps_url: mapsUrl,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "Create order API error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "حدث خطأ غير متوقع أثناء إنشاء الطلب.",
        details:
          error instanceof Error
            ? error.message
            : "Unknown server error",
      },
      { status: 500 }
    );
  }
}