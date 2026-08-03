import { NextResponse } from "next/server";

import {
  calculateProductPrice,
  type GlobalOfferSettings,
} from "../../../lib/pricing";
import { createAdminClient } from "../../../lib/supabase/admin";
import { sendNewOrderNotification } from "../../../lib/telegram";

type RequestedOrderItem = {
  id?: string;
  name?: string;
  price?: number;
  quantity?: number;
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

  /*
   * تبقى للتوافق مع الواجهة الحالية فقط.
   * الخادم لا يثق بها ولا يستخدمها بالتسعير.
   */
  subtotal?: number;
  whatsapp_number?: string;
  items?: RequestedOrderItem[];
};

type SavedOrderItem = {
  id: string;
  name: string;

  // السعر النهائي بعد العرض
  price: number;

  quantity: number;
  size: string | null;
  note: string | null;

  // معلومات محفوظة للتقارير
  original_price: number;
  discount_amount: number;
  offer_applied: boolean;
  offer_name: string | null;
};

type DatabaseProduct = {
  id: string;
  name: string;
  category: string | null;
  price: number;
  available: boolean | null;
};

type PlatformSettingsRow = {
  delivery_enabled: boolean | null;
  kitchen_latitude: number | null;
  kitchen_longitude: number | null;

  delivery_base_distance_km: number | null;
  delivery_base_fee: number | null;

  delivery_step_distance_km: number | null;
  delivery_step_fee: number | null;

  delivery_max_distance_km: number | null;

  minimum_order: number | null;
  free_delivery_threshold: number | null;

  global_offer_enabled: boolean | null;
  global_offer_name: string | null;
  global_offer_type: string | null;
  global_offer_value: number | null;

  global_offer_starts_at: string | null;
  global_offer_ends_at: string | null;

  global_offer_min_item_price: number | null;

  global_offer_exclude_addons: boolean | null;
  global_offer_exclude_drinks: boolean | null;

  loyalty_enabled: boolean | null;
  loyalty_required_orders: number | null;
  loyalty_discount_type: string | null;
  loyalty_discount_value: number | null;
  loyalty_max_discount: number | null;
  loyalty_min_order_amount: number | null;
  loyalty_include_delivery: boolean | null;
};

type DeliverySettings = {
  delivery_enabled: boolean;

  kitchen_latitude: number;
  kitchen_longitude: number;

  delivery_base_distance_km: number;
  delivery_base_fee: number;

  delivery_step_distance_km: number;
  delivery_step_fee: number;

  delivery_max_distance_km: number;

  minimum_order: number;
  free_delivery_threshold: number;
};

type LoyaltySettings = {
  enabled: boolean;
  requiredOrders: number;
  type: "percentage" | "fixed";
  value: number;
  maxDiscount: number;
  minOrderAmount: number;
  includeDelivery: boolean;
};

type LoyaltyResult = {
  applied: boolean;
  discount: number;
  completedOrders: number;
  requiredOrders: number;
  remainingOrders: number;
};

type PricingAndDeliverySettings = {
  delivery: DeliverySettings;
  offer: GlobalOfferSettings;
  excludeAddons: boolean;
  excludeDrinks: boolean;
  loyalty: LoyaltySettings;
};

const DEFAULT_DELIVERY_SETTINGS: DeliverySettings = {
  delivery_enabled: true,

  kitchen_latitude: 30.4745,
  kitchen_longitude: 47.805556,

  delivery_base_distance_km: 5,
  delivery_base_fee: 1000,

  delivery_step_distance_km: 5,
  delivery_step_fee: 1000,

  delivery_max_distance_km: 20,

  minimum_order: 0,
  free_delivery_threshold: 0,
};

const DEFAULT_OFFER_SETTINGS: GlobalOfferSettings = {
  enabled: false,
  name: "عرض زاد",
  type: "percentage",
  value: 0,
  minItemPrice: 0,
  startsAt: null,
  endsAt: null,
};

const DEFAULT_LOYALTY_SETTINGS: LoyaltySettings = {
  enabled: false,
  requiredOrders: 5,
  type: "percentage",
  value: 0,
  maxDiscount: 0,
  minOrderAmount: 0,
  includeDelivery: false,
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

function cleanDecimal(
  value: unknown,
  fallback: number
) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return fallback;
  }

  return number;
}

function normalizePhone(value: unknown) {
  return cleanText(value).replace(/[^\d]/g, "");
}

function normalizeCategory(
  value: string | null
) {
  return cleanText(value).toLowerCase();
}

function calculateDiscount(
  amount: number,
  type: "percentage" | "fixed",
  value: number,
  maxDiscount: number
) {
  let discount =
    type === "percentage"
      ? Math.round(amount * (value / 100))
      : value;

  if (maxDiscount > 0) {
    discount = Math.min(discount, maxDiscount);
  }

  return Math.max(0, Math.min(discount, amount));
}

function isExcludedCategory(
  category: string | null,
  excludeAddons: boolean,
  excludeDrinks: boolean
) {
  const normalizedCategory =
    normalizeCategory(category);

  const isAddon =
    normalizedCategory === "إضافات" ||
    normalizedCategory === "اضافات" ||
    normalizedCategory === "addons" ||
    normalizedCategory === "extras";

  const isDrink =
    normalizedCategory === "مشروبات" ||
    normalizedCategory === "مشروب" ||
    normalizedCategory === "drinks" ||
    normalizedCategory === "beverages";

  return (
    (excludeAddons && isAddon) ||
    (excludeDrinks && isDrink)
  );
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

function calculateDeliveryFee(
  distanceKm: number,
  settings: DeliverySettings
) {
  if (
    distanceKm <=
    settings.delivery_base_distance_km
  ) {
    return settings.delivery_base_fee;
  }

  const extraDistance =
    distanceKm -
    settings.delivery_base_distance_km;

  const extraSteps = Math.ceil(
    extraDistance /
      settings.delivery_step_distance_km
  );

  return (
    settings.delivery_base_fee +
    extraSteps * settings.delivery_step_fee
  );
}

async function getPricingAndDeliverySettings() {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("platform_settings")
    .select(
      `
        delivery_enabled,
        kitchen_latitude,
        kitchen_longitude,

        delivery_base_distance_km,
        delivery_base_fee,

        delivery_step_distance_km,
        delivery_step_fee,

        delivery_max_distance_km,

        minimum_order,
        free_delivery_threshold,

        global_offer_enabled,
        global_offer_name,
        global_offer_type,
        global_offer_value,

        global_offer_starts_at,
        global_offer_ends_at,

        global_offer_min_item_price,

        global_offer_exclude_addons,
        global_offer_exclude_drinks,

        loyalty_enabled,
        loyalty_required_orders,
        loyalty_discount_type,
        loyalty_discount_value,
        loyalty_max_discount,
        loyalty_min_order_amount,
        loyalty_include_delivery
      `
    )
    .eq("id", 1)
    .maybeSingle();

  if (error) {
    console.error(
      "Platform settings fetch error:",
      error
    );

    return {
      delivery: DEFAULT_DELIVERY_SETTINGS,
      offer: DEFAULT_OFFER_SETTINGS,
      excludeAddons: true,
      excludeDrinks: true,
      loyalty: DEFAULT_LOYALTY_SETTINGS,
    } satisfies PricingAndDeliverySettings;
  }

  const settings =
    (data ?? null) as PlatformSettingsRow | null;

  if (!settings) {
    return {
      delivery: DEFAULT_DELIVERY_SETTINGS,
      offer: DEFAULT_OFFER_SETTINGS,
      excludeAddons: true,
      excludeDrinks: true,
      loyalty: DEFAULT_LOYALTY_SETTINGS,
    } satisfies PricingAndDeliverySettings;
  }

  const delivery: DeliverySettings = {
    delivery_enabled:
      settings.delivery_enabled !== false,

    kitchen_latitude: cleanDecimal(
      settings.kitchen_latitude,
      DEFAULT_DELIVERY_SETTINGS.kitchen_latitude
    ),

    kitchen_longitude: cleanDecimal(
      settings.kitchen_longitude,
      DEFAULT_DELIVERY_SETTINGS.kitchen_longitude
    ),

    delivery_base_distance_km: Math.max(
      0.1,
      cleanDecimal(
        settings.delivery_base_distance_km,
        DEFAULT_DELIVERY_SETTINGS
          .delivery_base_distance_km
      )
    ),

    delivery_base_fee: cleanNumber(
      settings.delivery_base_fee
    ),

    delivery_step_distance_km: Math.max(
      0.1,
      cleanDecimal(
        settings.delivery_step_distance_km,
        DEFAULT_DELIVERY_SETTINGS
          .delivery_step_distance_km
      )
    ),

    delivery_step_fee: cleanNumber(
      settings.delivery_step_fee
    ),

    delivery_max_distance_km: Math.max(
      0.1,
      cleanDecimal(
        settings.delivery_max_distance_km,
        DEFAULT_DELIVERY_SETTINGS
          .delivery_max_distance_km
      )
    ),

    minimum_order: cleanNumber(
      settings.minimum_order
    ),

    free_delivery_threshold: cleanNumber(
      settings.free_delivery_threshold
    ),
  };

  const offerType =
    settings.global_offer_type === "fixed"
      ? "fixed"
      : "percentage";

  const rawOfferValue = cleanNumber(
    settings.global_offer_value
  );

  const offerValue =
    offerType === "percentage"
      ? Math.min(100, rawOfferValue)
      : rawOfferValue;

  const offer: GlobalOfferSettings = {
    enabled:
      settings.global_offer_enabled === true,

    name:
      cleanText(settings.global_offer_name) ||
      "عرض زاد",

    type: offerType,
    value: offerValue,

    minItemPrice: cleanNumber(
      settings.global_offer_min_item_price
    ),

    startsAt:
      settings.global_offer_starts_at ?? null,

    endsAt:
      settings.global_offer_ends_at ?? null,
  };

  const loyaltyType =
    settings.loyalty_discount_type === "fixed"
      ? "fixed"
      : "percentage";

  const rawLoyaltyValue = cleanNumber(
    settings.loyalty_discount_value
  );

  const loyalty: LoyaltySettings = {
    enabled:
      settings.loyalty_enabled === true,

    requiredOrders: Math.max(
      1,
      cleanNumber(
        settings.loyalty_required_orders
      ) || 5
    ),

    type: loyaltyType,

    value:
      loyaltyType === "percentage"
        ? Math.min(100, rawLoyaltyValue)
        : rawLoyaltyValue,

    maxDiscount: cleanNumber(
      settings.loyalty_max_discount
    ),

    minOrderAmount: cleanNumber(
      settings.loyalty_min_order_amount
    ),

    includeDelivery:
      settings.loyalty_include_delivery === true,
  };

  return {
    delivery,
    offer,

    excludeAddons:
      settings.global_offer_exclude_addons !==
      false,

    excludeDrinks:
      settings.global_offer_exclude_drinks !==
      false,

    loyalty,
  } satisfies PricingAndDeliverySettings;
}

function buildRequestedItems(
  rawItems: RequestedOrderItem[] | undefined
) {
  if (!Array.isArray(rawItems)) {
    return [];
  }

  return rawItems
    .map((item) => ({
      id: cleanText(item.id),

      quantity: Math.max(
        1,
        cleanNumber(item.quantity)
      ),

      size:
        cleanText(item.size) || null,

      note:
        cleanText(item.note) || null,
    }))
    .filter(
      (item) =>
        item.id &&
        item.quantity > 0
    );
}

async function calculateLoyalty(params: {
  normalizedPhone: string;
  subtotal: number;
  deliveryFee: number;
  settings: LoyaltySettings;
}): Promise<LoyaltyResult> {
  const {
    normalizedPhone,
    subtotal,
    deliveryFee,
    settings,
  } = params;

  const emptyResult: LoyaltyResult = {
    applied: false,
    discount: 0,
    completedOrders: 0,
    requiredOrders: settings.requiredOrders,
    remainingOrders: settings.requiredOrders,
  };

  if (
    !settings.enabled ||
    !normalizedPhone ||
    settings.value <= 0 ||
    subtotal < settings.minOrderAmount
  ) {
    return emptyResult;
  }

  const supabase = createAdminClient();

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
      normalizedPhone
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
      "Active loyalty reward lookup error:",
      activeRewardError
    );

    return emptyResult;
  }

  if ((activeRewardCount ?? 0) > 0) {
    return emptyResult;
  }

  const {
    data: lastRewardOrder,
    error: lastRewardError,
  } = await supabase
    .from("orders")
    .select("created_at")
    .eq(
      "customer_phone_normalized",
      normalizedPhone
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
      "Last loyalty reward lookup error:",
      lastRewardError
    );

    return emptyResult;
  }

  let completedOrdersQuery = supabase
    .from("orders")
    .select("*", {
      count: "exact",
      head: true,
    })
    .eq(
      "customer_phone_normalized",
      normalizedPhone
    )
    .eq("status", "delivered")
    .eq("loyalty_applied", false);

  if (lastRewardOrder?.created_at) {
    completedOrdersQuery =
      completedOrdersQuery.gt(
        "created_at",
        lastRewardOrder.created_at
      );
  }

  const {
    count: completedOrdersCount,
    error: completedOrdersError,
  } = await completedOrdersQuery;

  if (completedOrdersError) {
    console.error(
      "Completed loyalty orders lookup error:",
      completedOrdersError
    );

    return emptyResult;
  }

  const completedOrders =
    completedOrdersCount ?? 0;

  const remainingOrders = Math.max(
    0,
    settings.requiredOrders -
      completedOrders
  );

  if (
    completedOrders <
    settings.requiredOrders
  ) {
    return {
      ...emptyResult,
      completedOrders,
      remainingOrders,
    };
  }

  const discountBase =
    subtotal +
    (settings.includeDelivery
      ? deliveryFee
      : 0);

  const discount = calculateDiscount(
    discountBase,
    settings.type,
    settings.value,
    settings.maxDiscount
  );

  return {
    applied: discount > 0,
    discount,
    completedOrders,
    requiredOrders:
      settings.requiredOrders,
    remainingOrders: 0,
  };
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

    const normalizedPhone =
      normalizePhone(customerPhone);

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

    const whatsappNumber = normalizePhone(
      body.whatsapp_number
    );

    /*
     * لا نستخدم body.subtotal.
     * لا نستخدم item.price.
     * لا نستخدم item.name.
     */
    const requestedItems =
      buildRequestedItems(body.items);

    if (!customerName) {
      return NextResponse.json(
        { error: "اسم الزبون مطلوب." },
        { status: 400 }
      );
    }

    if (!normalizedPhone) {
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

    if (
      customerLatitude < -90 ||
      customerLatitude > 90 ||
      customerLongitude < -180 ||
      customerLongitude > 180
    ) {
      return NextResponse.json(
        {
          error:
            "إحداثيات موقع التوصيل غير صحيحة.",
        },
        { status: 400 }
      );
    }

    if (requestedItems.length === 0) {
      return NextResponse.json(
        {
          error:
            "لا توجد أصناف صحيحة داخل الطلب.",
        },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    const productIds = Array.from(
      new Set(
        requestedItems.map(
          (item) => item.id
        )
      )
    );

    const {
      data: productsData,
      error: productsError,
    } = await supabase
      .from("products")
      .select(
        `
          id,
          name,
          category,
          price,
          available
        `
      )
      .in("id", productIds);

    if (productsError) {
      console.error(
        "Products fetch error:",
        productsError
      );

      return NextResponse.json(
        {
          error:
            "تعذر التحقق من أسعار الوجبات.",
          details: productsError.message,
        },
        { status: 500 }
      );
    }

    const products =
      (productsData ?? []) as DatabaseProduct[];

    const productMap = new Map(
      products.map((product) => [
        product.id,
        product,
      ])
    );

    for (const requestedItem of requestedItems) {
      const product = productMap.get(
        requestedItem.id
      );

      if (!product) {
        return NextResponse.json(
          {
            error:
              "إحدى الوجبات لم تعد موجودة في المنيو. يرجى تحديث الصفحة والمحاولة مجددًا.",
            product_id: requestedItem.id,
          },
          { status: 400 }
        );
      }

      if (product.available === false) {
        return NextResponse.json(
          {
            error: `الوجبة "${product.name}" غير متوفرة حاليًا.`,
          },
          { status: 400 }
        );
      }
    }

    const settings =
      await getPricingAndDeliverySettings();

    const pricedItems: SavedOrderItem[] =
      requestedItems.map(
        (requestedItem) => {
          const product = productMap.get(
            requestedItem.id
          )!;

          const originalPrice =
            cleanNumber(product.price);

          const excludedFromOffer =
            isExcludedCategory(
              product.category,
              settings.excludeAddons,
              settings.excludeDrinks
            );

          const pricing =
            calculateProductPrice(
              originalPrice,
              {
                ...settings.offer,

                enabled:
                  settings.offer.enabled &&
                  !excludedFromOffer,
              }
            );

          return {
            id: product.id,
            name: product.name,

            price: pricing.finalPrice,

            quantity:
              requestedItem.quantity,

            size: requestedItem.size,
            note: requestedItem.note,

            original_price:
              pricing.originalPrice,

            discount_amount:
              pricing.discountAmount,

            offer_applied:
              pricing.offerActive,

            offer_name:
              pricing.offerActive
                ? pricing.offerName ?? null
                : null,
          };
        }
      );

    const originalSubtotal =
      pricedItems.reduce(
        (total, item) =>
          total +
          item.original_price *
            item.quantity,
        0
      );

    const subtotal =
      pricedItems.reduce(
        (total, item) =>
          total +
          item.price *
            item.quantity,
        0
      );

    const globalOfferDiscount =
      Math.max(
        0,
        originalSubtotal - subtotal
      );

    if (subtotal <= 0) {
      return NextResponse.json(
        {
          error:
            "قيمة الطلب بعد التسعير غير صحيحة.",
        },
        { status: 400 }
      );
    }

    if (
      !settings.delivery.delivery_enabled
    ) {
      return NextResponse.json(
        {
          error:
            "نعتذر، خدمة التوصيل متوقفة حاليًا.",
        },
        { status: 400 }
      );
    }

    if (
      settings.delivery.minimum_order > 0 &&
      subtotal <
        settings.delivery.minimum_order
    ) {
      return NextResponse.json(
        {
          error:
            `الحد الأدنى للطلب هو ${settings.delivery.minimum_order.toLocaleString(
              "en-US"
            )} دينار بعد الخصم.`,
        },
        { status: 400 }
      );
    }

    const distanceKm =
      calculateDistanceKm(
        settings.delivery
          .kitchen_latitude,

        settings.delivery
          .kitchen_longitude,

        customerLatitude,
        customerLongitude
      );

    if (
      distanceKm >
      settings.delivery
        .delivery_max_distance_km
    ) {
      return NextResponse.json(
        {
          error: `عذرًا، موقع التوصيل يبعد ${distanceKm.toFixed(
            1
          )} كم، والحد الأقصى للتوصيل هو ${settings.delivery.delivery_max_distance_km} كم.`,
        },
        { status: 400 }
      );
    }

    let deliveryFee =
      calculateDeliveryFee(
        distanceKm,
        settings.delivery
      );

    if (
      settings.delivery
        .free_delivery_threshold > 0 &&
      subtotal >=
        settings.delivery
          .free_delivery_threshold
    ) {
      deliveryFee = 0;
    }

    const loyalty =
      await calculateLoyalty({
        normalizedPhone,
        subtotal,
        deliveryFee,
        settings: settings.loyalty,
      });

    const loyaltyDiscount =
      loyalty.discount;

    const totalDiscount =
      globalOfferDiscount +
      loyaltyDiscount;

    const total = Math.max(
      0,
      subtotal +
        deliveryFee -
        loyaltyDiscount
    );

    const appliedOfferName =
      pricedItems.find(
        (item) =>
          item.offer_applied
      )?.offer_name ?? null;

    const mapsUrl =
      `https://www.google.com/maps?q=` +
      `${customerLatitude},${customerLongitude}`;

    const fullAddress =
      `${customerAddress}\n` +
      `📍 الموقع: ${mapsUrl}\n` +
      `📏 المسافة التقريبية: ${distanceKm.toFixed(
        1
      )} كم`;

    const { data, error } =
      await supabase
        .from("orders")
        .insert({
          customer_name: customerName,
          customer_phone: customerPhone,

          customer_phone_normalized:
            normalizedPhone,

          customer_address:
            fullAddress,

          customer_note:
            customerNote,

          original_subtotal:
            originalSubtotal,

          global_offer_discount:
            globalOfferDiscount,

          loyalty_discount:
            loyaltyDiscount,

          total_discount:
            totalDiscount,

          loyalty_applied:
            loyalty.applied,

          applied_offer_name:
            appliedOfferName,

          subtotal,
          delivery_fee: deliveryFee,
          total,

          status: "new",
          source: "website",

          whatsapp_number:
            whatsappNumber,

          items: pricedItems,
        })
        .select(
          `
            id,
            order_number,
            status,
            created_at,

            original_subtotal,
            global_offer_discount,
            loyalty_discount,
            total_discount,
            loyalty_applied,

            subtotal,
            delivery_fee,
            total,

            applied_offer_name
          `
        )
        .single();

    if (error) {
      console.error(
        "Order insert error:",
        JSON.stringify(
          error,
          null,
          2
        )
      );

      return NextResponse.json(
        {
          error:
            "تعذر حفظ الطلب.",

          details:
            error.message,
        },
        { status: 500 }
      );
    }

    try {
      await sendNewOrderNotification({
        id: data.id,

        order_number:
          Number(data.order_number),

        customer_name:
          customerName,

        customer_phone:
          customerPhone,

        customer_address:
          fullAddress,

        customer_note:
          customerNote,

        subtotal,
        delivery_fee:
          deliveryFee,

        total,
        items: pricedItems,
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

        pricing: {
          original_subtotal:
            originalSubtotal,

          global_offer_discount:
            globalOfferDiscount,

          loyalty_discount:
            loyaltyDiscount,

          subtotal,

          total_discount:
            totalDiscount,

          applied_offer_name:
            appliedOfferName,
        },

        loyalty: {
          enabled:
            settings.loyalty.enabled,

          applied:
            loyalty.applied,

          discount:
            loyaltyDiscount,

          completed_orders:
            loyalty.completedOrders,

          required_orders:
            loyalty.requiredOrders,

          remaining_orders:
            loyalty.remainingOrders,
        },

        delivery: {
          distance_km: Number(
            distanceKm.toFixed(1)
          ),

          delivery_fee:
            deliveryFee,

          total,

          latitude:
            customerLatitude,

          longitude:
            customerLongitude,

          maps_url:
            mapsUrl,
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