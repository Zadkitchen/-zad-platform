"use client";

import {
  LocateFixed,
  Loader2,
  ShoppingBag,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { useCart } from "../../context/cart-context";
import CartItem from "./CartItem";

type PlatformSettings = {
  restaurant_name?: string;
  slogan?: string;
  whatsapp_number?: string;

  accepting_orders?: boolean;
  kitchen_open?: boolean;
  minimum_order?: number;
  free_delivery_threshold?: number;

  closed_message?: string;
  orders_paused_message?: string;

  delivery_enabled?: boolean;

  restaurant_latitude?: number;
  restaurant_longitude?: number;

  kitchen_latitude?: number;
  kitchen_longitude?: number;

  delivery_base_distance_km?: number;
  delivery_base_fee?: number;

  delivery_step_distance_km?: number;
  delivery_step_fee?: number;

  delivery_max_distance_km?: number;
};

type CreateOrderResponse = {
  success?: boolean;

  order?: {
    id: string;
    order_number: number;
    status: string;
    created_at: string;
  };

  pricing?: {
    original_subtotal?: number;
    global_offer_discount?: number;
    loyalty_discount?: number;
    subtotal?: number;
    total_discount?: number;
    applied_offer_name?: string | null;
  };

  loyalty?: {
    enabled?: boolean;
    applied?: boolean;
    discount?: number;
    completed_orders?: number;
    required_orders?: number;
    remaining_orders?: number;
  };

  delivery?: {
    distance_km?: number;
    delivery_fee?: number;
    total?: number;
    latitude?: number;
    longitude?: number;
    maps_url?: string;
  };

  error?: string;
  details?: string;
};

type CustomerLocation = {
  latitude: number;
  longitude: number;
  accuracy: number;
};
type LoyaltyStatus = {
  found: boolean;
  enabled: boolean;

  customer_name?: string | null;

  progress: number;
  required: number;
  remaining: number;

  reward_ready: boolean;
  reward_in_use?: boolean;

  discount_type: "percentage" | "fixed";
  discount_value: number;
};
const DEFAULT_WHATSAPP_NUMBER = "9647722032536";
const DEFAULT_RESTAURANT_NAME = "مطبخ زاد";
const DEFAULT_SLOGAN = "زاد... نكهة تستحق العودة";

/*
  موقع مطبخ زاد:

  30°28'28.2"N
  47°48'20.0"E
*/
const DEFAULT_RESTAURANT_LATITUDE = 30.4745;
const DEFAULT_RESTAURANT_LONGITUDE = 47.805556;

/*
  نظام التوصيل الافتراضي:

  أول 5 كم = 1,000 د.ع
  كل 5 كم إضافية = 1,000 د.ع
  الحد الأقصى = 20 كم
*/
const DEFAULT_BASE_DISTANCE_KM = 5;
const DEFAULT_BASE_DELIVERY_FEE = 1000;

const DEFAULT_STEP_DISTANCE_KM = 5;
const DEFAULT_STEP_DELIVERY_FEE = 1000;

const DEFAULT_MAX_DISTANCE_KM = 20;

function formatPrice(price: number) {
  return new Intl.NumberFormat("en-US").format(
    Math.round(price)
  );
}

function formatDistance(distance: number) {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(distance);
}

function createOrderReference(orderId: string) {
  return orderId
    .replace(/-/g, "")
    .slice(0, 8)
    .toUpperCase();
}

function degreesToRadians(degrees: number) {
  return degrees * (Math.PI / 180);
}

/*
  حساب المسافة المباشرة بين نقطتين
  باستخدام معادلة Haversine.
*/
function calculateDistanceInKilometers(
  latitude1: number,
  longitude1: number,
  latitude2: number,
  longitude2: number
) {
  const earthRadiusKm = 6371;

  const latitudeDifference = degreesToRadians(
    latitude2 - latitude1
  );

  const longitudeDifference = degreesToRadians(
    longitude2 - longitude1
  );

  const firstLatitude = degreesToRadians(latitude1);
  const secondLatitude = degreesToRadians(latitude2);

  const value =
    Math.sin(latitudeDifference / 2) ** 2 +
    Math.cos(firstLatitude) *
      Math.cos(secondLatitude) *
      Math.sin(longitudeDifference / 2) ** 2;

  const angularDistance =
    2 *
    Math.atan2(
      Math.sqrt(value),
      Math.sqrt(1 - value)
    );

  return earthRadiusKm * angularDistance;
}

function calculateDeliveryFee({
  distanceKm,
  baseDistanceKm,
  baseFee,
  stepDistanceKm,
  stepFee,
}: {
  distanceKm: number;
  baseDistanceKm: number;
  baseFee: number;
  stepDistanceKm: number;
  stepFee: number;
}) {
  if (distanceKm <= 0) {
    return 0;
  }

  if (distanceKm <= baseDistanceKm) {
    return baseFee;
  }

  const additionalDistance =
    distanceKm - baseDistanceKm;

  const additionalSteps = Math.ceil(
    additionalDistance / stepDistanceKm
  );

  return baseFee + additionalSteps * stepFee;
}

export default function CartDrawer() {
  const {
    items,
    isCartOpen,
    subtotal,
    totalItems,
    closeCart,
    clearCart,
  } = useCart();

  const [customerName, setCustomerName] =
    useState("");

  const [customerPhone, setCustomerPhone] =
    useState("");

  const [loyalty, setLoyalty] =
    useState<LoyaltyStatus | null>(null);

  const [checkingLoyalty, setCheckingLoyalty] =
    useState(false);

  const [customerAddress, setCustomerAddress] =
    useState("");

  const [orderNote, setOrderNote] =
    useState("");

  const [customerLocation, setCustomerLocation] =
    useState<CustomerLocation | null>(null);

  const [deliveryDistance, setDeliveryDistance] =
    useState<number | null>(null);

  const [isLocating, setIsLocating] =
    useState(false);

  const [locationConfirmed, setLocationConfirmed] =
    useState(false);

  const [locationError, setLocationError] =
    useState("");

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const submissionLockRef = useRef(false);

  const [settings, setSettings] =
    useState<PlatformSettings>({
      restaurant_name: DEFAULT_RESTAURANT_NAME,
      slogan: DEFAULT_SLOGAN,
      whatsapp_number: DEFAULT_WHATSAPP_NUMBER,

      accepting_orders: true,
      kitchen_open: true,
      minimum_order: 0,
      free_delivery_threshold: 0,

      closed_message:
        "نعتذر، المطبخ مغلق حالياً.",

      orders_paused_message:
        "نعتذر، تم إيقاف استقبال الطلبات مؤقتاً.",

      delivery_enabled: true,

      restaurant_latitude:
        DEFAULT_RESTAURANT_LATITUDE,

      restaurant_longitude:
        DEFAULT_RESTAURANT_LONGITUDE,

      delivery_base_distance_km:
        DEFAULT_BASE_DISTANCE_KM,

      delivery_base_fee:
        DEFAULT_BASE_DELIVERY_FEE,

      delivery_step_distance_km:
        DEFAULT_STEP_DISTANCE_KM,

      delivery_step_fee:
        DEFAULT_STEP_DELIVERY_FEE,

      delivery_max_distance_km:
        DEFAULT_MAX_DISTANCE_KM,
    });

  const [settingsLoading, setSettingsLoading] =
    useState(true);

  useEffect(() => {
    if (!isCartOpen) return;

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow =
        previousOverflow;
    };
  }, [isCartOpen]);

  useEffect(() => {
    const handleEscape = (
      event: KeyboardEvent
    ) => {
      if (
        event.key === "Escape" &&
        !isSubmitting
      ) {
        closeCart();
      }
    };

    window.addEventListener(
      "keydown",
      handleEscape
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleEscape
      );
    };
  }, [closeCart, isSubmitting]);

  useEffect(() => {
    if (!isCartOpen) {
      return;
    }

    let isMounted = true;

    async function loadPlatformSettings() {
      try {
        setSettingsLoading(true);

        const response = await fetch(
          "/api/platform-settings",
          {
            method: "GET",
            cache: "no-store",
          }
        );

        if (!response.ok) {
          throw new Error(
            "تعذر تحميل إعدادات المنصة"
          );
        }

        const data =
          (await response.json()) as PlatformSettings;

        if (!isMounted) return;

        setSettings((currentSettings) => ({
          ...currentSettings,
          ...data,

          whatsapp_number:
            data.whatsapp_number?.replace(
              /[^\d]/g,
              ""
            ) || DEFAULT_WHATSAPP_NUMBER,
        }));
      } catch (error) {
        console.error(
          "Platform settings error:",
          error
        );
      } finally {
        if (isMounted) {
          setSettingsLoading(false);
        }
      }
    }

    loadPlatformSettings();

    const handleFocus = () => {
      loadPlatformSettings();
    };

    window.addEventListener("focus", handleFocus);

    return () => {
      isMounted = false;

      window.removeEventListener(
        "focus",
        handleFocus
      );
    };
  }, [isCartOpen]);

  useEffect(() => {
    const phone = customerPhone.replace(/[^\d]/g, "");

    if (phone.length < 10) {
      setLoyalty(null);
      setCheckingLoyalty(false);
      return;
    }

    const controller = new AbortController();

    const timeout = window.setTimeout(async () => {
      try {
        setCheckingLoyalty(true);

        const response = await fetch(
          `/api/loyalty-status?phone=${phone}`,
          {
            cache: "no-store",
            signal: controller.signal,
          }
        );

        if (!response.ok) {
          throw new Error(
            "تعذر تحميل حالة الولاء."
          );
        }

        const data =
          (await response.json()) as LoyaltyStatus;

        setLoyalty(data);
      } catch (error) {
        if (
          !controller.signal.aborted
        ) {
          console.error(
            "Loyalty status error:",
            error
          );
          setLoyalty(null);
        }
      } finally {
        if (!controller.signal.aborted) {
          setCheckingLoyalty(false);
        }
      }
    }, 500);

    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [customerPhone]);

  const restaurantName =
    settings.restaurant_name?.trim() ||
    DEFAULT_RESTAURANT_NAME;

  const slogan =
    settings.slogan?.trim() ||
    DEFAULT_SLOGAN;

  const whatsappNumber =
    settings.whatsapp_number?.replace(
      /[^\d]/g,
      ""
    ) || DEFAULT_WHATSAPP_NUMBER;

  const minimumOrder = Math.max(
    0,
    Number(settings.minimum_order ?? 0)
  );

  const deliveryEnabled =
    settings.delivery_enabled !== false;

  const restaurantLatitude = Number(
    settings.kitchen_latitude ??
      settings.restaurant_latitude ??
      DEFAULT_RESTAURANT_LATITUDE
  );

  const restaurantLongitude = Number(
    settings.kitchen_longitude ??
      settings.restaurant_longitude ??
      DEFAULT_RESTAURANT_LONGITUDE
  );

  const baseDistanceKm = Math.max(
    0.1,
    Number(
      settings.delivery_base_distance_km ??
        DEFAULT_BASE_DISTANCE_KM
    )
  );

  const baseDeliveryFee = Math.max(
    0,
    Number(
      settings.delivery_base_fee ??
        DEFAULT_BASE_DELIVERY_FEE
    )
  );

  const stepDistanceKm = Math.max(
    0.1,
    Number(
      settings.delivery_step_distance_km ??
        DEFAULT_STEP_DISTANCE_KM
    )
  );

  const stepDeliveryFee = Math.max(
    0,
    Number(
      settings.delivery_step_fee ??
        DEFAULT_STEP_DELIVERY_FEE
    )
  );

  const maximumDeliveryDistance = Math.max(
    baseDistanceKm,
    Number(
      settings.delivery_max_distance_km ??
        DEFAULT_MAX_DISTANCE_KM
    )
  );

  const deliveryFee = useMemo(() => {
    if (
      deliveryDistance === null ||
      !deliveryEnabled ||
      deliveryDistance >
        maximumDeliveryDistance
    ) {
      return 0;
    }

    return calculateDeliveryFee({
      distanceKm: deliveryDistance,
      baseDistanceKm,
      baseFee: baseDeliveryFee,
      stepDistanceKm,
      stepFee: stepDeliveryFee,
    });
  }, [
    deliveryDistance,
    deliveryEnabled,
    maximumDeliveryDistance,
    baseDistanceKm,
    baseDeliveryFee,
    stepDistanceKm,
    stepDeliveryFee,
  ]);

  const freeDeliveryThreshold = Math.max(
    0,
    Number(settings.free_delivery_threshold ?? 0)
  );

  const hasFreeDelivery =
    freeDeliveryThreshold > 0 &&
    Number(subtotal) >= freeDeliveryThreshold;

  const finalDeliveryFee = hasFreeDelivery
    ? 0
    : Number(deliveryFee);

  const totalAmount =
    Number(subtotal) + finalDeliveryFee;

  const customerMapsUrl =
    customerLocation
      ? `https://www.google.com/maps?q=${customerLocation.latitude},${customerLocation.longitude}`
      : "";

  function resetLocation() {
    setCustomerLocation(null);
    setDeliveryDistance(null);
    setLocationConfirmed(false);
    setLocationError("");
  }

  function getCurrentLocation() {
    if (!deliveryEnabled) {
      alert(
        "خدمة التوصيل متوقفة حالياً."
      );
      return;
    }

    if (!navigator.geolocation) {
      setLocationError(
        "المتصفح لا يدعم تحديد الموقع."
      );

      alert(
        "المتصفح لا يدعم تحديد الموقع. جرّب فتح المنصة من متصفح حديث."
      );

      return;
    }

    setIsLocating(true);
    setLocationError("");
    setLocationConfirmed(false);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const latitude =
          position.coords.latitude;

        const longitude =
          position.coords.longitude;

        const accuracy =
          position.coords.accuracy;

        const calculatedDistance =
          calculateDistanceInKilometers(
            restaurantLatitude,
            restaurantLongitude,
            latitude,
            longitude
          );

        const roundedDistance =
          Number(calculatedDistance.toFixed(2));

        setCustomerLocation({
          latitude,
          longitude,
          accuracy,
        });

        setDeliveryDistance(
          roundedDistance
        );

        if (
          roundedDistance >
          maximumDeliveryDistance
        ) {
                setLocationConfirmed(false);

          setLocationError(
            `موقعك يبعد ${formatDistance(
              roundedDistance
            )} كم، والتوصيل متاح حتى ${formatDistance(
              maximumDeliveryDistance
            )} كم فقط.`
          );

          setIsLocating(false);
          return;
        }

        setLocationConfirmed(true);
        setLocationError("");
        setIsLocating(false);
      },
      (error) => {
        console.error(
          "Geolocation error:",
          error
        );

        let errorMessage =
          "تعذر تحديد الموقع. حاول مرة أخرى.";

        if (
          error.code ===
          error.PERMISSION_DENIED
        ) {
          errorMessage =
            "تم رفض صلاحية الموقع. فعّل الموقع من إعدادات المتصفح ثم حاول مرة أخرى.";
        }

        if (
          error.code ===
          error.POSITION_UNAVAILABLE
        ) {
          errorMessage =
            "موقع الجهاز غير متاح حالياً. تأكد من تشغيل GPS.";
        }

        if (
          error.code === error.TIMEOUT
        ) {
          errorMessage =
            "استغرق تحديد الموقع وقتاً طويلاً. حاول مرة أخرى قرب نافذة أو في مكان مفتوح.";
        }

        setLocationError(errorMessage);
        setLocationConfirmed(false);
        setIsLocating(false);

        alert(errorMessage);
      },
      {
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 0,
      }
    );
  }

  function createWhatsAppMessage(params: {
    orderReference: string;
    serverSubtotal: number;
    serverDeliveryFee: number;
    serverTotal: number;
    loyaltyDiscount: number;
    loyaltyApplied: boolean;
  }) {
    const {
      orderReference,
      serverSubtotal,
      serverDeliveryFee,
      serverTotal,
      loyaltyDiscount,
      loyaltyApplied,
    } = params;

    const orderItems = items
      .map((item, index) => {
        const itemTotal =
          Number(item.price) *
          Number(item.quantity);

        return [
          `${index + 1}- ${item.name}`,

          item.size
            ? `الحجم: ${item.size}`
            : "",

          `الكمية: ${item.quantity}`,

          `السعر: ${formatPrice(
            Number(item.price)
          )} د.ع`,

          `مجموع الصنف: ${formatPrice(
            itemTotal
          )} د.ع`,

          item.note
            ? `ملاحظة الصنف: ${item.note}`
            : "",
        ]
          .filter(Boolean)
          .join("\n");
      })
      .join("\n\n");

    return [
      `السلام عليكم، أريد تأكيد طلب من ${restaurantName}:`,
      "",
      `رقم الطلب: #${orderReference}`,
      "",
      orderItems,
      "",
      "━━━━━━━━━━━━",
      `عدد القطع: ${totalItems}`,
      `مجموع الوجبات: ${formatPrice(
        serverSubtotal
      )} د.ع`,

      loyaltyApplied && loyaltyDiscount > 0
        ? `خصم الولاء: -${formatPrice(
            loyaltyDiscount
          )} د.ع 🎁`
        : "",

      serverDeliveryFee <= 0
        ? "أجرة التوصيل: مجاني"
        : `أجرة التوصيل: ${formatPrice(
            serverDeliveryFee
          )} د.ع`,

      `الإجمالي النهائي: ${formatPrice(
        serverTotal
      )} د.ع`,
      "━━━━━━━━━━━━",
      "",
      `الاسم: ${customerName.trim()}`,
      `رقم الهاتف: ${customerPhone.trim()}`,
      `العنوان: ${customerAddress.trim()}`,

      deliveryDistance !== null
        ? `المسافة التقريبية: ${formatDistance(
            deliveryDistance
          )} كم`
        : "",

      customerMapsUrl
        ? `موقع الزبون: ${customerMapsUrl}`
        : "",

      orderNote.trim()
        ? `ملاحظات الطلب: ${orderNote.trim()}`
        : "ملاحظات الطلب: لا توجد",

      "",
      slogan,
    ]
      .filter(Boolean)
      .join("\n");
  }

  async function handleCheckout() {
    if (
      submissionLockRef.current ||
      isSubmitting
    ) {
      return;
    }

    if (items.length === 0) {
      alert("السلة فارغة");
      return;
    }

    if (settingsLoading) {
      alert(
        "يرجى الانتظار لحين تحميل إعدادات المنصة"
      );
      return;
    }

    if (
      settings.kitchen_open === false
    ) {
      alert(
        settings.closed_message ||
          "نعتذر، المطبخ مغلق حالياً."
      );
      return;
    }

    if (
      settings.accepting_orders === false
    ) {
      alert(
        settings.orders_paused_message ||
          "نعتذر، تم إيقاف استقبال الطلبات مؤقتاً."
      );
      return;
    }

    if (!deliveryEnabled) {
      alert(
        "خدمة التوصيل متوقفة حالياً."
      );
      return;
    }

    if (
      minimumOrder > 0 &&
      subtotal < minimumOrder
    ) {
      alert(
        `الحد الأدنى للطلب هو ${formatPrice(
          minimumOrder
        )} د.ع`
      );
      return;
    }

    if (!customerName.trim()) {
      alert("يرجى كتابة اسم الزبون");
      return;
    }

    if (!customerPhone.trim()) {
      alert("يرجى كتابة رقم الهاتف");
      return;
    }

    if (!customerAddress.trim()) {
      alert("يرجى كتابة عنوان التوصيل");
      return;
    }

    if (
      !locationConfirmed ||
      !customerLocation ||
      deliveryDistance === null
    ) {
      alert(
        "يرجى الضغط على زر تحديد موقعي قبل إرسال الطلب."
      );
      return;
    }

    if (
      deliveryDistance >
      maximumDeliveryDistance
    ) {
      alert(
        `نعتذر، التوصيل متاح حتى ${formatDistance(
          maximumDeliveryDistance
        )} كم فقط.`
      );
      return;
    }

    if (!whatsappNumber) {
      alert(
        "رقم الواتساب غير مضبوط في إعدادات المنصة"
      );
      return;
    }

    submissionLockRef.current = true;
    setIsSubmitting(true);

    const controller =
      new AbortController();

    const timeoutId =
      window.setTimeout(() => {
        controller.abort();
      }, 20000);

    try {
      const response = await fetch(
        "/api/orders",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
            Accept: "application/json",
          },

          cache: "no-store",
          signal: controller.signal,

          body: JSON.stringify({
            customer_name:
              customerName.trim(),

            customer_phone:
              customerPhone.trim(),

            customer_address:
              customerAddress.trim(),

            customer_note:
              orderNote.trim(),

            customer_latitude:
              customerLocation.latitude,

            customer_longitude:
              customerLocation.longitude,

            customer_location_accuracy:
              customerLocation.accuracy,

            customer_maps_url:
              customerMapsUrl,

            delivery_distance_km:
              Number(
                deliveryDistance.toFixed(2)
              ),

            subtotal: Number(subtotal),

            delivery_fee:
              Number(finalDeliveryFee),

            total: Number(totalAmount),

            whatsapp_number:
              whatsappNumber,

            items: items.map((item) => ({
              id: String(item.id),
              name: String(item.name),
              price: Number(item.price),
              quantity: Number(
                item.quantity
              ),

              size: item.size
                ? String(item.size)
                : null,

              note: item.note
                ? String(item.note)
                : null,
            })),
          }),
        }
      );

      const responseText =
        await response.text();

      let result: CreateOrderResponse =
        {};

      if (responseText) {
        try {
          result = JSON.parse(
            responseText
          ) as CreateOrderResponse;
        } catch {
          throw new Error(
            "الخادم أعاد استجابة غير صحيحة."
          );
        }
      }

      if (!response.ok) {
        throw new Error(
          result.details ||
            result.error ||
            `تعذر حفظ الطلب. رمز الخطأ: ${response.status}`
        );
      }

      if (
        !result.success ||
        !result.order?.id
      ) {
        throw new Error(
          result.details ||
            result.error ||
            "تم الاتصال بالخادم، لكن لم يرجع رقم الطلب."
        );
      }

      const orderReference = String(
        result.order.order_number
      );

      const serverSubtotal = Math.max(
        0,
        Number(
          result.pricing?.subtotal ??
            subtotal
        )
      );

      const serverDeliveryFee = Math.max(
        0,
        Number(
          result.delivery?.delivery_fee ??
            finalDeliveryFee
        )
      );

      const loyaltyDiscount = Math.max(
        0,
        Number(
          result.pricing?.loyalty_discount ??
            result.loyalty?.discount ??
            0
        )
      );

      const loyaltyApplied =
        result.loyalty?.applied === true &&
        loyaltyDiscount > 0;

      if (loyaltyApplied) {
        setLoyalty((current) =>
          current
            ? {
                ...current,
                reward_ready: false,
                reward_in_use: true,
              }
            : current
        );
      }

      const serverTotal = Math.max(
        0,
        Number(
          result.delivery?.total ??
            serverSubtotal +
              serverDeliveryFee -
              loyaltyDiscount
        )
      );

      const message = createWhatsAppMessage({
        orderReference,
        serverSubtotal,
        serverDeliveryFee,
        serverTotal,
        loyaltyDiscount,
        loyaltyApplied,
      });

      const whatsappUrl =
        `https://wa.me/${whatsappNumber}` +
        `?text=${encodeURIComponent(
          message
        )}`;

      window.location.href =
        whatsappUrl;
    } catch (error) {
      console.error(
        "Checkout error:",
        error
      );

      let errorMessage =
        "حدث خطأ أثناء حفظ الطلب.";

      if (
        error instanceof DOMException &&
        error.name === "AbortError"
      ) {
        errorMessage =
          "انتهت مهلة إرسال الطلب. تأكد من الإنترنت وحاول مرة أخرى.";
      } else if (
        error instanceof Error
      ) {
        errorMessage = error.message;
      }

      alert(
        `${errorMessage}\n\nلم يتم إرسال الطلب إلى واتساب.`
      );
    } finally {
      window.clearTimeout(timeoutId);
      submissionLockRef.current = false;
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <div
        onClick={() => {
          if (!isSubmitting) {
            closeCart();
          }
        }}
        aria-hidden="true"
        className={`fixed inset-0 z-50 bg-black/75 backdrop-blur-sm transition-opacity duration-300 ${
          isCartOpen
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0"
        }`}
      />

      <aside
        dir="rtl"
        role="dialog"
        aria-modal="true"
        aria-label={`سلة طلب ${restaurantName}`}
        className={`fixed right-0 top-0 z-[60] flex h-dvh w-full max-w-[470px] flex-col border-l border-[#d4af37]/20 bg-[#0b0b0b] shadow-2xl transition-transform duration-300 ${
          isCartOpen
            ? "translate-x-0"
            : "translate-x-full"
        }`}
      >
        <header className="flex items-center justify-between border-b border-white/10 px-5 py-5">
          <div>
            <p className="text-xs tracking-[0.25em] text-[#d4af37]">
              ZAD KITCHEN
            </p>

            <h2 className="mt-1 text-2xl font-black text-white">
              سلة الطلب
            </h2>
          </div>

          <button
            type="button"
            onClick={closeCart}
            disabled={isSubmitting}
            aria-label="إغلاق السلة"
            className="rounded-full border border-white/10 bg-white/5 p-2.5 text-white transition hover:border-[#d4af37]/50 hover:text-[#d4af37] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X size={23} />
          </button>
        </header>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
            <div className="flex h-24 w-24 items-center justify-center rounded-full border border-[#d4af37]/20 bg-[#d4af37]/5 text-[#d4af37]">
              <ShoppingBag size={42} />
            </div>

            <h3 className="mt-6 text-xl font-bold text-white">
              السلة فارغة
            </h3>

            <p className="mt-2 max-w-xs leading-7 text-neutral-400">
              اختر وجبتك المفضلة من منيو زاد
              واضغط على زر أضف للسلة.
            </p>

            <button
              type="button"
              onClick={closeCart}
              className="mt-6 rounded-xl bg-[#d4af37] px-7 py-3 font-bold text-black transition hover:bg-[#efd46b]"
            >
              تصفح المنيو
            </button>
          </div>
        ) : (
          <>
            <div className="flex-1 space-y-4 overflow-y-auto px-4 py-5">
              {items.map((item) => (
                <CartItem
                  key={item.id}
                  item={item}
                />
              ))}

              <section className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                <h3 className="mb-4 text-lg font-bold text-white">
                  معلومات التوصيل
                </h3>

                <div className="space-y-3">
                  <input
                    type="text"
                    value={customerName}
                    disabled={isSubmitting}
                    onChange={(event) =>
                      setCustomerName(
                        event.target.value
                      )
                    }
                    placeholder="اسم الزبون"
                    autoComplete="name"
                    className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-[#d4af37]/60 disabled:cursor-not-allowed disabled:opacity-60"
                  />

                  <input
                    type="tel"
                    value={customerPhone}
                    disabled={isSubmitting}
                    onChange={(event) =>
                      setCustomerPhone(
                        event.target.value
                      )
                    }
                    placeholder="رقم الهاتف"
                    inputMode="tel"
                    autoComplete="tel"
                    className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-[#d4af37]/60 disabled:cursor-not-allowed disabled:opacity-60"
                  />

                  {checkingLoyalty && (
                    <div className="rounded-xl border border-white/10 bg-white/[0.035] px-4 py-3 text-sm text-white/60">
                      جاري التحقق من برنامج الولاء...
                    </div>
                  )}

                  {!checkingLoyalty &&
                    loyalty?.enabled && (
                      <div
                        className={`rounded-2xl border p-4 ${
                          loyalty.reward_in_use
                            ? "border-blue-500/30 bg-blue-500/10"
                            : loyalty.reward_ready
                              ? "border-[#d4af37]/40 bg-[#d4af37]/10"
                              : "border-white/10 bg-white/[0.035]"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-sm font-black text-[#d4af37]">
                              🎁 برنامج الولاء
                            </p>

                            {loyalty.customer_name && (
                              <p className="mt-1 text-xs text-white/45">
                                أهلاً {loyalty.customer_name}
                              </p>
                            )}
                          </div>

                          <span className="rounded-full bg-white/[0.06] px-3 py-1 text-xs font-black text-white/60">
                            {loyalty.progress} / {loyalty.required}
                          </span>
                        </div>

                        <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/10">
                          <div
                            style={{
                              width: `${
                                loyalty.required > 0
                                  ? Math.min(
                                      100,
                                      Math.round(
                                        (loyalty.progress /
                                          loyalty.required) *
                                          100
                                      )
                                    )
                                  : 0
                              }%`,
                            }}
                            className="h-full rounded-full bg-[#d4af37] transition-all duration-500"
                          />
                        </div>

                        {loyalty.reward_in_use ? (
                          <div className="mt-4 rounded-xl border border-blue-500/25 bg-blue-500/10 px-4 py-3">
                            <p className="font-black text-blue-300">
                              🎁 مكافأتك مستخدمة حاليًا
                            </p>

                            <p className="mt-1 text-sm leading-6 text-white/70">
                              تم تطبيق خصم الولاء على طلب جارٍ.
                              بعد تسليم الطلب تبدأ دورة جديدة تلقائيًا.
                            </p>
                          </div>
                        ) : loyalty.reward_ready ? (
                          <div className="mt-4 rounded-xl border border-[#d4af37]/25 bg-black/20 px-4 py-3">
                            <p className="font-black text-[#d4af37]">
                              🎉 لديك مكافأة جاهزة
                            </p>

                            <p className="mt-1 text-sm leading-6 text-white/70">
                              سيتم تطبيق خصم الولاء تلقائيًا على هذا الطلب.
                            </p>

                            <p className="mt-2 text-sm font-black text-emerald-300">
                              قيمة الخصم:{" "}
                              {loyalty.discount_type ===
                              "percentage"
                                ? `${loyalty.discount_value}%`
                                : `${formatPrice(
                                    loyalty.discount_value
                                  )} د.ع`}
                            </p>
                          </div>
                        ) : (
                          <p className="mt-4 text-sm leading-6 text-white/60">
                            {loyalty.remaining === 1
                              ? "باقي طلب واحد فقط للحصول على مكافأة الولاء."
                              : `باقي ${loyalty.remaining} طلبات للحصول على مكافأة الولاء.`}
                          </p>
                        )}
                      </div>
                    )}

                  <textarea
                    rows={3}
                    value={customerAddress}
                    disabled={isSubmitting}
                    onChange={(event) =>
                      setCustomerAddress(
                        event.target.value
                      )
                    }
                    placeholder="عنوان التوصيل بالتفصيل"
                    autoComplete="street-address"
                    className="w-full resize-none rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-[#d4af37]/60 disabled:cursor-not-allowed disabled:opacity-60"
                  />

                  <div className="rounded-xl border border-[#d4af37]/20 bg-[#d4af37]/5 p-3">
                    <button
                      type="button"
                      onClick={
                        getCurrentLocation
                      }
                      disabled={
                        isLocating ||
                        isSubmitting ||
                        !deliveryEnabled
                      }
                      className={`flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 font-black transition disabled:cursor-not-allowed disabled:opacity-50 ${
                        locationConfirmed
                          ? "border border-emerald-500/30 bg-emerald-500/15 text-emerald-300"
                          : "bg-[#d4af37] text-black hover:bg-[#efd46b]"
                      }`}
                    >
                      {isLocating ? (
                        <Loader2
                          size={20}
                          className="animate-spin"
                        />
                      ) : (
                        <LocateFixed
                          size={20}
                        />
                      )}

                      {isLocating
                        ? "جاري تحديد موقعك..."
                        : locationConfirmed
                        ? "تم تحديد الموقع بنجاح"
                        : "تحديد موقعي"}
                    </button>

                    {!deliveryEnabled && (
                      <p className="mt-3 text-center text-sm font-bold text-red-300">
                        خدمة التوصيل متوقفة
                        حالياً.
                      </p>
                    )}

                    {locationConfirmed &&
                      deliveryDistance !==
                        null && (
                        <div className="mt-3 space-y-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-3 text-sm">
                          <div className="flex items-center justify-between">
                            <span className="text-neutral-300">
                              المسافة
                              التقريبية
                            </span>

                            <span className="font-bold text-emerald-300">
                              {formatDistance(
                                deliveryDistance
                              )}{" "}
                              كم
                            </span>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-neutral-300">
                              أجرة التوصيل
                            </span>

                            <span className="font-bold text-emerald-300">
                              {hasFreeDelivery
                                ? "مجاني 🎉"
                                : `${formatPrice(
                                    finalDeliveryFee
                                  )} د.ع`}
                            </span>
                          </div>

                          {customerMapsUrl && (
                            <a
                              href={
                                customerMapsUrl
                              }
                              target="_blank"
                              rel="noreferrer"
                              className="block text-center font-bold text-[#d4af37] underline underline-offset-4"
                            >
                              فتح الموقع على
                              الخريطة
                            </a>
                          )}
                        </div>
                      )}

                    {locationError && (
                      <div className="mt-3 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-3 text-sm font-bold leading-6 text-red-300">
                        {locationError}
                      </div>
                    )}

                    {(customerLocation ||
                      locationError) && (
                      <button
                        type="button"
                        onClick={
                          resetLocation
                        }
                        disabled={
                          isLocating ||
                          isSubmitting
                        }
                        className="mt-3 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm font-bold text-neutral-300 transition hover:bg-white/10 disabled:opacity-50"
                      >
                        إعادة تحديد الموقع
                      </button>
                    )}
                  </div>

                  <textarea
                    rows={3}
                    value={orderNote}
                    disabled={isSubmitting}
                    onChange={(event) =>
                      setOrderNote(
                        event.target.value
                      )
                    }
                    placeholder="ملاحظات إضافية"
                    className="w-full resize-none rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-[#d4af37]/60 disabled:cursor-not-allowed disabled:opacity-60"
                  />
                </div>
              </section>
            </div>

            <footer className="border-t border-white/10 bg-[#0d0d0d] px-5 py-5">
              {minimumOrder > 0 &&
                subtotal < minimumOrder && (
                  <div className="mb-4 rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm font-bold text-amber-300">
                    الحد الأدنى للطلب هو{" "}
                    {formatPrice(
                      minimumOrder
                    )}{" "}
                    د.ع
                  </div>
                )}

              {settings.kitchen_open ===
                false && (
                <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-300">
                  {settings.closed_message ||
                    "نعتذر، المطبخ مغلق حالياً."}
                </div>
              )}

              {settings.kitchen_open !==
                false &&
                settings.accepting_orders ===
                  false && (
                  <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-300">
                    {settings.orders_paused_message ||
                      "نعتذر، تم إيقاف استقبال الطلبات مؤقتاً."}
                  </div>
                )}

              <div className="mb-4 space-y-2 rounded-xl border border-white/10 bg-white/[0.035] p-4">
                <div className="flex items-center justify-between">
                  <span className="text-neutral-400">
                    مجموع الوجبات
                  </span>

                  <span className="font-bold text-white">
                    {formatPrice(
                      subtotal
                    )}{" "}
                    د.ع
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-neutral-400">
                    أجرة التوصيل
                  </span>

                  <span
                    className={`font-bold ${
                      hasFreeDelivery
                        ? "text-emerald-300"
                        : "text-white"
                    }`}
                  >
                    {!locationConfirmed
                      ? "حدد موقعك"
                      : hasFreeDelivery
                      ? "مجاني 🎉"
                      : `${formatPrice(
                          finalDeliveryFee
                        )} د.ع`}
                  </span>
                </div>

                {freeDeliveryThreshold > 0 && (
                  <div
                    className={`rounded-xl px-3 py-2 text-center text-xs font-bold ${
                      hasFreeDelivery
                        ? "border border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
                        : "border border-[#d4af37]/15 bg-[#d4af37]/5 text-white/50"
                    }`}
                  >
                    {hasFreeDelivery
                      ? "🎉 حصلت على توصيل مجاني"
                      : `أضف ${formatPrice(
                          Math.max(
                            0,
                            freeDeliveryThreshold -
                              Number(subtotal)
                          )
                        )} د.ع لتحصل على توصيل مجاني`}
                  </div>
                )}

                <div className="border-t border-white/10 pt-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">
                      الإجمالي النهائي
                    </span>

                    <span className="text-2xl font-black text-[#d4af37]">
                      {formatPrice(
                        totalAmount
                      )}{" "}
                      د.ع
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-[1fr_auto] gap-3">
                <button
                  type="button"
                  onClick={
                    handleCheckout
                  }
                  disabled={
                    isSubmitting ||
                    isLocating ||
                    settingsLoading ||
                    !locationConfirmed ||
                    !deliveryEnabled ||
                    settings.kitchen_open ===
                      false ||
                    settings.accepting_orders ===
                      false ||
                    (minimumOrder > 0 &&
                      subtotal < minimumOrder)
                  }
                  className="rounded-xl bg-[#d4af37] px-5 py-4 font-black text-black transition hover:bg-[#efd46b] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSubmitting
                    ? "جاري حفظ الطلب..."
                    : settingsLoading
                    ? "جاري تحميل الإعدادات..."
                    : !locationConfirmed
                    ? "حدد موقعك أولاً"
                    : "إرسال الطلب إلى واتساب"}
                </button>

                <button
                  type="button"
                  onClick={clearCart}
                  disabled={isSubmitting}
                  className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-4 font-bold text-red-400 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  تفريغ
                </button>
              </div>
            </footer>
          </>
        )}
      </aside>
    </>
  );
}