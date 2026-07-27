import { ArrowRight, Settings } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { createClient } from "../../../lib/supabase/server";

export default async function AdminSettingsPage() {
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
        <header className="rounded-3xl border border-white/10 bg-[#111] p-5 sm:p-6">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-sm font-bold text-white/45 transition hover:text-[#d4af37]"
          >
            <ArrowRight size={17} />
            الرجوع إلى لوحة الإدارة
          </Link>

          <div className="mt-6 flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#d4af37]/10 text-[#d4af37]">
              <Settings size={26} />
            </div>

            <div>
              <p className="text-xs font-black tracking-[0.3em] text-[#d4af37]">
                ZAD SETTINGS
              </p>

              <h1 className="mt-2 text-3xl font-black">
                إعدادات المنصة
              </h1>
            </div>
          </div>

          <p className="mt-5 leading-8 text-white/50">
            هذا القسم مخصص لاحقًا لتعديل رقم الواتساب، أوقات العمل،
            حالة استقبال الطلبات، وأجور التوصيل.
          </p>
        </header>

        <section className="mt-6 rounded-3xl border border-white/10 bg-[#111] p-6">
          <h2 className="text-xl font-black">
            قريبًا
          </h2>

          <p className="mt-3 text-white/45">
            صفحة الإعدادات جاهزة الآن، وسنضيف حقول التحكم الفعلية بالمرحلة القادمة.
          </p>
        </section>
      </div>
    </main>
  );
}