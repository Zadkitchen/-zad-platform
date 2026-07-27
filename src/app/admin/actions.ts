"use server";

import { redirect } from "next/navigation";

import { createClient } from "../../lib/supabase/server";

export async function login(formData: FormData) {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();

  const password = String(
    formData.get("password") ?? ""
  );

  if (!email || !password) {
    redirect(
      `/admin/login?error=${encodeURIComponent(
        "يرجى إدخال البريد الإلكتروني وكلمة المرور."
      )}`
    );
  }

  const supabase = await createClient();

  const { data, error } =
    await supabase.auth.signInWithPassword({
      email,
      password,
    });

  if (error || !data.user) {
    redirect(
      `/admin/login?error=${encodeURIComponent(
        "البريد الإلكتروني أو كلمة المرور غير صحيحة."
      )}`
    );
  }

  const { data: admin, error: adminError } =
    await supabase
      .from("admin_users")
      .select("active")
      .eq("user_id", data.user.id)
      .maybeSingle();

  if (
    adminError ||
    !admin ||
    admin.active !== true
  ) {
    await supabase.auth.signOut();

    redirect(
      `/admin/login?error=${encodeURIComponent(
        "هذا الحساب غير مخول للدخول إلى لوحة الإدارة."
      )}`
    );
  }

  redirect("/admin");
}

export async function logout() {
  const supabase = await createClient();

  await supabase.auth.signOut();

  redirect("/admin/login");
}