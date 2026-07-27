import { redirect } from "next/navigation";

import { createClient } from "../../../lib/supabase/server";
import { login } from "../actions";

type LoginPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function AdminLoginPage({
  searchParams,
}: LoginPageProps) {
  const params = await searchParams;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: admin } = await supabase
      .from("admin_users")
      .select("active")
      .eq("user_id", user.id)
      .maybeSingle();

    if (admin?.active === true) {
      redirect("/admin");
    }
  }

  return (
    <main
      dir="rtl"
      className="flex min-h-screen items-center justify-center bg-[#070707] px-4 text-white"
    >
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#111] p-6 sm:p-8">
        <div className="text-center">
          <p className="text-xs font-black tracking-[0.3em] text-[#d4af37]">
            ZAD ADMIN
          </p>

          <h1 className="mt-3 text-3xl font-black">
            تسجيل دخول الإدارة
          </h1>

          <p className="mt-3 text-sm leading-7 text-white/45">
            أدخل البريد الإلكتروني وكلمة المرور الخاصة بمدير منصة زاد.
          </p>
        </div>

        {params.error && (
          <div className="mt-6 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-300">
            {params.error}
          </div>
        )}

        <form action={login} className="mt-7 space-y-5">
          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-bold text-white/70"
            >
              البريد الإلكتروني
            </label>

            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="admin@example.com"
              className="h-14 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-left outline-none transition placeholder:text-white/20 focus:border-[#d4af37]/60"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-2 block text-sm font-bold text-white/70"
            >
              كلمة المرور
            </label>

            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              placeholder="••••••••"
              className="h-14 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-left outline-none transition placeholder:text-white/20 focus:border-[#d4af37]/60"
            />
          </div>

          <button
            type="submit"
            className="h-14 w-full rounded-2xl bg-[#d4af37] font-black text-black transition hover:bg-[#efd46b] active:scale-[0.98]"
          >
            تسجيل الدخول
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-white/25">
          مطبخ زاد — لوحة الإدارة
        </p>
      </div>
    </main>
  );
}