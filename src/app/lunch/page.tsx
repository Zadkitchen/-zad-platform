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

export default async function LunchPage() {
  const supabase = await createClient();

  const { data, error } = await supabase
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
    });

  if (error) {
    console.error(
      "LUNCH PRODUCTS ERROR:",
      error.message
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

  const databaseProducts =
    (data ?? []) as DatabaseProduct[];

  const products: MenuProduct[] =
    databaseProducts.map((product) => ({
      id: product.id,
      name: product.name,
      price: Number(product.price),

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
    }));

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
        </header>

        <LunchMenuClient products={products} />
      </div>
    </main>
  );
}