"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "../../../../lib/supabase/server";

const allowedImageTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

export async function createProduct(
  formData: FormData
) {
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

  const name = String(
    formData.get("name") ?? ""
  ).trim();

  const description = String(
    formData.get("description") ?? ""
  ).trim();

  const category = String(
    formData.get("category") ?? ""
  ).trim();

  const menuType = String(
    formData.get("menu_type") ?? ""
  ).trim();

  const size = String(
    formData.get("size") ?? ""
  ).trim();

  const price = Number(formData.get("price"));

  if (!name) {
    throw new Error("اسم الوجبة مطلوب.");
  }

  if (!category) {
    throw new Error("تصنيف الوجبة مطلوب.");
  }

  if (
    !["lunch", "evening", "both"].includes(
      menuType
    )
  ) {
    throw new Error("نوع المنيو غير صحيح.");
  }

  if (
    !Number.isFinite(price) ||
    price <= 0
  ) {
    throw new Error("السعر غير صحيح.");
  }

  let imageUrl: string | null = null;
  let uploadedFilePath: string | null = null;

  const image = formData.get("image");

  if (
    image instanceof File &&
    image.size > 0
  ) {
    if (!allowedImageTypes.includes(image.type)) {
      throw new Error(
        "صيغة الصورة غير مدعومة."
      );
    }

    if (image.size > 5 * 1024 * 1024) {
      throw new Error(
        "حجم الصورة يجب ألا يتجاوز 5 ميغابايت."
      );
    }

    const extension =
      image.name.split(".").pop()?.toLowerCase() ||
      "webp";

    uploadedFilePath = `${user.id}/${randomUUID()}.${extension}`;

    const { error: uploadError } =
      await supabase.storage
        .from("product-images")
        .upload(uploadedFilePath, image, {
          cacheControl: "3600",
          upsert: false,
          contentType: image.type,
        });

    if (uploadError) {
      throw new Error(
        `تعذر رفع الصورة: ${uploadError.message}`
      );
    }

    const { data: publicUrlData } =
      supabase.storage
        .from("product-images")
        .getPublicUrl(uploadedFilePath);

    imageUrl = publicUrlData.publicUrl;
  }

  const slugBase = name
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

  const slug = `${slugBase}-${randomUUID().slice(
    0,
    8
  )}`;

  const { error: insertError } = await supabase
    .from("products")
    .insert({
      name,
      slug,
      description: description || null,
      category,
      menu_type: menuType,
      price,
      image_url: imageUrl,
      size: size || null,
      featured:
        formData.get("featured") === "on",
      is_new: formData.get("is_new") === "on",
      available:
        formData.get("available") === "on",
      sort_order: 0,
    });

  if (insertError) {
    if (uploadedFilePath) {
      await supabase.storage
        .from("product-images")
        .remove([uploadedFilePath]);
    }

    throw new Error(
      `تعذر حفظ الوجبة: ${insertError.message}`
    );
  }

  revalidatePath("/admin");
  revalidatePath("/admin/products");

  redirect("/admin/products");
}