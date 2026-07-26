import {
  ChefHat,
  CircleDollarSign,
  LogOut,
  PackageOpen,
  Settings,
  ShoppingBag,
  Utensils,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { createClient } from "../../lib/supabase/server";
import { logout } from "./actions";

export default async function AdminPage() {
  const supabase = await createClient();

  // التأكد من أن المستخدم مسجل دخول
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  // التأكد من أن المستخدم مدير فعال
  const { data: admin, error: adminError } =
    await supabase
      .from("admin_users")
      .select("full_name, active")
      .eq("user_id", user.id)
      .maybeSingle();

  if (
    adminError ||
    !admin ||
    admin.active !== true
  ) {
    await supabase.auth.signOut();
    redirect("/admin/login");
  }

  // عدد جميع الوجبات
  const { count: productsCount } =
    await supabase
      .from("products")
      .select("*", {
        count: "exact",
        head: true,
      });

  // عدد الوجبات المتوفرة
  const { count: availableProductsCount } =
    await supabase
      .from("products")
      .select("*", {
        count: "exact",
        head: true,
      })
      .eq("available", true);

  const statistics = [
    {
      title: "إجمالي الوجبات",
      value: productsCount ?? 0,
      icon: Utensils,
    },
    {
      title: "الوجبات المتوفرة",
      value: availableProductsCount ?? 0,
      icon: ChefHat,
    },
    {
      title: "الطلبات الجديدة",
      value: 0,
      icon: ShoppingBag,
    },
  ];

  const managementLinks = [
    {
      title: "إدارة الوجبات",
      description:
        "إضافة الوجبات وتعديل الأسعار والصور والتوفر.",
      href: "/admin/products",
      icon: PackageOpen,
    },
    {
      title: "الأسعار والعروض",
      description:
        "تحديث الأسعار وإنشاء عروض للزبائن.",
      href: "/admin/products",
      icon: CircleDollarSign,
    },
    {
      title: "إدارة الطلبات",
      description:
        "متابعة الطلبات الجديدة وحالة التحضير.",
      href: "/admin/orders",
      icon: ShoppingBag,
    },
    {
      title: "إعدادات المنصة",
      description:
        "رقم الواتساب وأوقات العمل واستقبال الطلبات.",
      href: "/admin/settings",
      icon: Settings,
    },
  ];

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-[#070707] px-4 py-6 text-white sm:px-6"
    >
      <div className="mx-auto max-w-7xl">
        <header className="rounded-3xl border border-white/10 bg-[#111] p-5 sm:p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-black tracking-[0.3em] text-[#d4af37]">
                ZAD ADMIN
              </p>

              <h1 className="mt-3 text-3xl font-black sm:text-4xl">
                أهلاً {admin.full_name ?? "حيدر"}
              </h1>

              <p className="mt-2 text-white/50">
                من هنا تتحكم بوجبات وأسعار وإعدادات
                منصة زاد.
              </p>
            </div>

            <form action={logout}>
              <button
                type="submit"
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-red-500/25 bg-red-500/10 px-5 py-3 font-black text-red-300 transition hover:bg-red-500 hover:text-white sm:w-auto"
              >
                <LogOut size={18} />
                تسجيل الخروج
              </button>
            </form>
          </div>
        </header>

        <section className="mt-6 grid gap-4 sm:grid-cols-3">
          {statistics.map((item) => {
            const Icon = item.icon;

            return (
              <article
                key={item.title}
                className="rounded-3xl border border-white/10 bg-[#111] p-5"
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-bold text-white/45">
                      {item.title}
                    </p>

                    <p className="mt-3 text-4xl font-black text-[#d4af37]">
                      {item.value}
                    </p>
                  </div>

                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#d4af37]/10 text-[#d4af37]">
                    <Icon size={25} />
                  </div>
                </div>
              </article>
            );
          })}
        </section>

        <section className="mt-8">
          <h2 className="text-2xl font-black">
            إدارة المنصة
          </h2>

          <p className="mt-2 text-white/45">
            اختر القسم الذي تريد إدارته.
          </p>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {managementLinks.map((item) => {
              const Icon = item.icon;

              return (
                <Link
                  key={item.title}
                  href={item.href}
                  className="group rounded-3xl border border-white/10 bg-[#111] p-5 transition hover:-translate-y-1 hover:border-[#d4af37]/40 hover:shadow-[0_20px_60px_rgba(212,175,55,0.08)]"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#d4af37]/10 text-[#d4af37]">
                      <Icon size={24} />
                    </div>

                    <div>
                      <h3 className="text-xl font-black transition group-hover:text-[#d4af37]">
                        {item.title}
                      </h3>

                      <p className="mt-2 leading-7 text-white/45">
                        {item.description}
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        <div className="mt-8 text-center text-sm text-white/25">
          مطبخ زاد — لوحة الإدارة
        </div>
      </div>
    </main>
  );
}