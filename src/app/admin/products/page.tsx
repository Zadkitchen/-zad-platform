import {
  ArrowRight,
  CirclePlus,
  PackageOpen,
  Search,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { createClient } from "../../../lib/supabase/server";

type Product = {
  id: string;
  name: string;
  description: string | null;
  category: string;
  menu_type: "lunch" | "evening" | "both";
  price: number;
  image_url: string | null;
  size: string | null;
  featured: boolean;
  is_new: boolean;
  available: boolean;
  sort_order: number;
};

function formatPrice(price: number) {
  return new Intl.NumberFormat("ar-US").format(price);
}

export default async function AdminProductsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  const { data: admin } = await supabase
    .from("admin_users")
    .select("active")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!admin || admin.active !== true) {
    redirect("/admin/login");
  }

  const { data, error } = await supabase
    .from("products")
    .select(
      `
        id,
        name,
        description,
        category,
        menu_type,
        price,
        image_url,
        size,
        featured,
        is_new,
        available,
        sort_order
      `
    )
    .order("sort_order", {
      ascending: true,
    })
    .order("created_at", {
      ascending: false,
    });

  const products = (data ?? []) as Product[];

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-[#070707] px-4 py-6 text-white sm:px-6"
    >
      <div className="mx-auto max-w-7xl">
        <header className="rounded-3xl border border-white/10 bg-[#111] p-5 sm:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <Link
                href="/admin"
                className="inline-flex items-center gap-2 text-sm font-bold text-white/45 transition hover:text-[#d4af37]"
              >
                <ArrowRight size={17} />
                الرجوع إلى لوحة الإدارة
              </Link>

              <p className="mt-5 text-xs font-black tracking-[0.3em] text-[#d4af37]">
                ZAD PRODUCTS
              </p>

              <h1 className="mt-2 text-3xl font-black sm:text-4xl">
                إدارة الوجبات
              </h1>

              <p className="mt-2 text-white/50">
                أضف الوجبات وعدّل أسعارها وتوفرها من هنا.
              </p>
            </div>

            <Link
              href="/admin/products/new"
              className="flex items-center justify-center gap-2 rounded-2xl bg-[#d4af37] px-6 py-4 font-black text-black transition hover:bg-[#efd46b] active:scale-[0.98]"
            >
              <CirclePlus size={20} />
              إضافة وجبة جديدة
            </Link>
          </div>
        </header>

        <section className="mt-6 rounded-3xl border border-white/10 bg-[#111] p-4">
          <div className="relative">
            <Search
              size={18}
              className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#d4af37]"
            />

            <input
              type="search"
              placeholder="ابحث عن وجبة..."
              className="h-14 w-full rounded-2xl border border-white/10 bg-white/[0.04] pr-12 pl-4 outline-none transition placeholder:text-white/25 focus:border-[#d4af37]/50"
            />
          </div>
        </section>

        {error && (
          <div className="mt-6 rounded-3xl border border-red-500/20 bg-red-500/10 p-5 text-red-300">
            تعذر تحميل الوجبات: {error.message}
          </div>
        )}

        {!error && products.length === 0 && (
          <section className="mt-6 flex min-h-[360px] flex-col items-center justify-center rounded-3xl border border-dashed border-white/10 bg-[#111] px-5 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-[#d4af37]/10 text-[#d4af37]">
              <PackageOpen size={36} />
            </div>

            <h2 className="mt-6 text-2xl font-black">
              لا توجد وجبات بعد
            </h2>

            <p className="mt-3 max-w-md leading-7 text-white/45">
              أضف أول وجبة إلى قاعدة البيانات، وبعدها ستظهر هنا
              ويمكن تعديلها من الهاتف.
            </p>

            <Link
              href="/admin/products/new"
              className="mt-6 flex items-center gap-2 rounded-2xl bg-[#d4af37] px-6 py-3 font-black text-black transition hover:bg-[#efd46b]"
            >
              <CirclePlus size={19} />
              إضافة أول وجبة
            </Link>
          </section>
        )}

        {!error && products.length > 0 && (
          <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {products.map((product) => (
              <article
                key={product.id}
                className="overflow-hidden rounded-3xl border border-white/10 bg-[#111]"
              >
                <div className="aspect-[16/10] bg-white/[0.04]">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-white/25">
                      لا توجد صورة
                    </div>
                  )}
                </div>

                <div className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-black text-[#d4af37]">
                        {product.category}
                      </p>

                      <h2 className="mt-2 text-xl font-black">
                        {product.name}
                      </h2>
                    </div>

                    <div className="text-left">
                      <p className="text-xl font-black text-[#d4af37]">
                        {formatPrice(product.price)}
                      </p>

                      <p className="text-xs text-white/35">
                        د.ع
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="rounded-full bg-white/[0.05] px-3 py-1 text-xs font-bold text-white/50">
                      {product.menu_type === "lunch"
                        ? "غداء"
                        : product.menu_type === "evening"
                          ? "مسائي"
                          : "غداء ومسائي"}
                    </span>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold ${
                        product.available
                          ? "bg-green-500/10 text-green-300"
                          : "bg-red-500/10 text-red-300"
                      }`}
                    >
                      {product.available
                        ? "متوفرة"
                        : "غير متوفرة"}
                    </span>

                    {product.featured && (
                      <span className="rounded-full bg-[#d4af37]/10 px-3 py-1 text-xs font-bold text-[#d4af37]">
                        الأكثر طلبًا
                      </span>
                    )}

                    {product.is_new && (
                      <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-bold text-blue-300">
                        جديد
                      </span>
                    )}
                  </div>

                  <Link
                    href={`/admin/products/${product.id}/edit`}
                    className="mt-5 flex h-12 w-full items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] font-black transition hover:border-[#d4af37]/40 hover:text-[#d4af37]"
                  >
                    تعديل الوجبة
                  </Link>
                </div>
              </article>
            ))}
          </section>
        )}
      </div>
    </main>
  );
}