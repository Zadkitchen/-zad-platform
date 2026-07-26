import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import ProductForm, {
  type ProductFormData,
} from "../../../../../components/admin/products/ProductForm";
import { createClient } from "../../../../../lib/supabase/server";
import { updateProduct } from "./actions";

type EditProductPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditProductPage({
  params,
}: EditProductPageProps) {
  const { id } = await params;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  const { data: admin, error: adminError } =
    await supabase
      .from("admin_users")
      .select("active")
      .eq("user_id", user.id)
      .maybeSingle();

  if (
    adminError ||
    !admin ||
    admin.active !== true
  ) {
    redirect("/admin/login");
  }

  const { data: product, error: productError } =
    await supabase
      .from("products")
      .select(
        `
          name,
          description,
          category,
          menu_type,
          price,
          image_url,
          size,
          featured,
          is_new,
          available
        `
      )
      .eq("id", id)
      .maybeSingle();

  if (productError || !product) {
    notFound();
  }

  const initialData: ProductFormData = {
    name: product.name ?? "",
    description: product.description ?? null,
    category: product.category ?? "",
    menu_type:
      product.menu_type === "lunch" ||
      product.menu_type === "evening" ||
      product.menu_type === "both"
        ? product.menu_type
        : "evening",
    price: Number(product.price ?? 0),
    image_url: product.image_url ?? null,
    size: product.size ?? null,
    featured: product.featured ?? false,
    is_new: product.is_new ?? false,
    available: product.available ?? true,
  };

  const updateProductWithId =
    updateProduct.bind(null, id);

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
            EDIT PRODUCT
          </p>

          <h1 className="mt-2 text-3xl font-black sm:text-4xl">
            تعديل الوجبة
          </h1>

          <p className="mt-2 text-white/45">
            عدّل المعلومات ثم اضغط حفظ التعديلات.
          </p>
        </header>

        <ProductForm
          key={id}
          action={updateProductWithId}
          initialData={initialData}
          submitLabel="حفظ التعديلات"
        />
      </div>
    </main>
  );
}