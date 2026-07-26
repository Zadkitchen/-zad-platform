import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import ProductForm from "../../../../components/admin/products/ProductForm";
import { createClient } from "../../../../lib/supabase/server";
import { createProduct } from "./actions";

export default async function NewProductPage() {
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

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-[#070707] px-4 py-6 text-white sm:px-6"
    >
      <div className="mx-auto max-w-4xl">
        <header className="mb-6 rounded-3xl border border-white/10 bg-[#111] p-5 sm:p-6">
          <Link
            href="/admin/products"
            className="inline-flex items-center gap-2 text-sm font-bold text-white/45 transition hover:text-[#d4af37]"
          >
            <ArrowRight size={17} />
            الرجوع إلى الوجبات
          </Link>

          <p className="mt-5 text-xs font-black tracking-[0.3em] text-[#d4af37]">
            NEW PRODUCT
          </p>

          <h1 className="mt-2 text-3xl font-black sm:text-4xl">
            إضافة وجبة جديدة
          </h1>

          <p className="mt-2 text-white/45">
            أدخل معلومات الوجبة وارفع صورتها ثم اضغط
            حفظ.
          </p>
        </header>

        <ProductForm action={createProduct} />
      </div>
    </main>
  );
}