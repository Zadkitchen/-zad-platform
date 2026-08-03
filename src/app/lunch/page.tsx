import {
  calculateProductPrice,
  type GlobalOfferSettings,
} from "../../lib/pricing";
import { createClient } from "../../lib/supabase/server";
import type { MenuProduct } from "../../types/menu";
import LunchMenuClient from "./LunchMenuClient";

export const dynamic = "force-dynamic";

type DatabaseProduct = {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  price: number;
  image_url: string | null;
  size: string | null;
  featured: boolean | null;
  available: boolean | null;
};

type OfferSettingsRow = {
  global_offer_enabled: boolean | null;
  global_offer_name: string | null;
  global_offer_type: string | null;
  global_offer_value: number | null;
  global_offer_starts_at: string | null;
  global_offer_ends_at: string | null;
  global_offer_min_item_price: number | null;
  global_offer_exclude_addons: boolean | null;
  global_offer_exclude_drinks: boolean | null;
};

export default async function LunchPage() {
  const supabase = await createClient();

  const [
    { data: productsData, error: productsError },
    { data: offerData, error: offerError },
  ] = await Promise.all([
    supabase
      .from("products")
      .select(
        `
          id,
          name,
          description,
          category,
          price,
          image_url,
          size,
          featured,
          available
        `
      )
      .in("menu_type", ["lunch", "both"])
      .eq("available", true)
      .order("sort_order", {
        ascending: true,
      })
      .order("created_at", {
        ascending: false,
      }),

    supabase
      .from("platform_settings")
      .select(
        `
          global_offer_enabled,
          global_offer_name,
          global_offer_type,
          global_offer_value,
          global_offer_starts_at,
          global_offer_ends_at,
          global_offer_min_item_price,
          global_offer_exclude_addons,
          global_offer_exclude_drinks
        `
      )
      .eq("id", 1)
      .maybeSingle(),
  ]);

  if (productsError) {
    console.error(
      "LUNCH PRODUCTS ERROR:",
      productsError.message
    );

    return (
      <main
        dir="rtl"
        className="min-h-screen bg-[#090909] px-4 py-10 text-white"
      >
        <div className="mx-auto max-w-7xl">
          <div className="rounded-3xl border border-red-500/20 bg-red-500/10 px-6 py-16 text-center">
            <h1 className="text-2xl font-black text-red-400">
              تعذر تحميل منيو الغداء
            </h1>

            <p className="mt-3 text-white/60">
              راجع Terminal لمعرفة تفاصيل الخطأ.
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (offerError) {
    console.error(
      "GLOBAL OFFER SETTINGS ERROR:",
      offerError.message
    );
  }

  const databaseProducts =
    (productsData ?? []) as DatabaseProduct[];

  const settingsRow =
    (offerData ?? null) as OfferSettingsRow | null;

  const offerSettings: GlobalOfferSettings = {
    enabled:
      settingsRow?.global_offer_enabled ?? false,

    name:
      settingsRow?.global_offer_name?.trim() ||
      "عرض زاد",

    type:
      settingsRow?.global_offer_type === "fixed"
        ? "fixed"
        : "percentage",

    value: Math.max(
      0,
      Number(
        settingsRow?.global_offer_value ?? 0
      )
    ),

    minItemPrice: Math.max(
      0,
      Number(
        settingsRow?.global_offer_min_item_price ??
          0
      )
    ),

    startsAt:
      settingsRow?.global_offer_starts_at ?? null,

    endsAt:
      settingsRow?.global_offer_ends_at ?? null,
  };

  const excludeAddons =
    settingsRow?.global_offer_exclude_addons ??
    true;

  const excludeDrinks =
    settingsRow?.global_offer_exclude_drinks ??
    true;

  const products: MenuProduct[] =
    databaseProducts.map((product) => {
      const originalPrice = Number(product.price);
      const category =
        product.category?.trim() ?? "";

      const excludedFromOffer =
        (excludeAddons &&
          category === "إضافات") ||
        (excludeDrinks &&
          category === "مشروبات");

      const pricing = calculateProductPrice(
        originalPrice,
        {
          ...offerSettings,
          enabled:
            offerSettings.enabled &&
            !excludedFromOffer,
        }
      );

      return {
        id: product.id,
        name: product.name,

        /*
          السعر الذي تعتمد عليه السلة.
          إذا العرض فعال يكون السعر المخفّض.
        */
        price: pricing.finalPrice,

        /*
          بيانات العرض التي تظهر داخل بطاقة الوجبة.
        */
        originalPrice: pricing.originalPrice,
        offerPrice: pricing.finalPrice,
        offerActive: pricing.offerActive,
        offerName: pricing.offerName,
        offerType: offerSettings.type,
        offerValue: offerSettings.value,
        discountAmount:
          pricing.discountAmount,
        discountPercentage:
          pricing.discountPercentage,

        description:
          product.description ?? undefined,

        category:
          product.category ?? undefined,

        image:
          product.image_url ?? undefined,

        size:
          product.size ?? undefined,

        featured:
          product.featured ?? false,

        available:
          product.available ?? true,
      };
    });

  const activeOfferName =
    products.find(
      (product) => product.offerActive
    )?.offerName ?? null;

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-[#090909] px-4 py-10 text-white"
    >
      <div className="mx-auto max-w-7xl">
        <header className="mb-10 text-center">
          <p className="text-sm font-bold tracking-[0.3em] text-[#d4af37]">
            ZAD KITCHEN
          </p>

          <h1 className="mt-3 text-4xl font-black">
            منيو الغداء
          </h1>

          <p className="mt-3 text-neutral-400">
            ابحث عن وجبتك أو اختر التصنيف المناسب
          </p>

          {activeOfferName && (
            <div className="mx-auto mt-5 w-fit rounded-full border border-[#d4af37]/25 bg-[#d4af37]/10 px-5 py-2 text-sm font-black text-[#d4af37]">
              🔥 {activeOfferName}
            </div>
          )}
        </header>

        <LunchMenuClient products={products} />
      </div>
    </main>
  );
}