"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "../../../../../lib/supabase/server";

const allowedImageTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

function getStoragePath(imageUrl: string | null) {
  if (!imageUrl) return null;

  const marker =
    "/storage/v1/object/public/product-images/";

  const index = imageUrl.indexOf(marker);

  if (index === -1) return null;

  return decodeURIComponent(
    imageUrl.slice(index + marker.length)
  );
}

export async function updateProduct(
  productId: string,
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

  const { data: currentProduct, error: fetchError } =
    await supabase
      .from("products")
      .select("image_url")
      .eq("id", productId)
      .maybeSingle();

  if (fetchError || !currentProduct) {
    throw new Error("لم يتم العثور على الوجبة.");
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
  );

  const size = String(
    formData.get("size") ?? ""
  ).trim();

  const price = Number(formData.get("price"));

  if (!name || !category) {
    throw new Error("اسم وتصنيف الوجبة مطلوبان.");
  }

  if (
    !["lunch", "evening", "both"].includes(menuType)
  ) {
    throw new Error("فترة المنيو غير صحيحة.");
  }

  if (!Number.isFinite(price) || price <= 0) {
    throw new Error("السعر غير صحيح.");
  }

  const oldImagePath = getStoragePath(
    currentProduct.image_url
  );

  const removeImage =
    formData.get("remove_image") === "true";

  const image = formData.get("image");

  let newImagePath: string | null = null;
  let finalImageUrl: string | null =
    removeImage ? null : currentProduct.image_url;

  if (image instanceof File && image.size > 0) {
    if (!allowedImageTypes.includes(image.type)) {
      throw new Error("صيغة الصورة غير مدعومة.");
    }

    if (image.size > 5 * 1024 * 1024) {
      throw new Error(
        "حجم الصورة يجب ألا يتجاوز 5 ميغابايت."
      );
    }

    const extension =
      image.name.split(".").pop()?.toLowerCase() ||
      "webp";

    newImagePath = `${user.id}/${randomUUID()}.${extension}`;

    const { error: uploadError } =
      await supabase.storage
        .from("product-images")
        .upload(newImagePath, image, {
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
        .getPublicUrl(newImagePath);

    finalImageUrl = publicUrlData.publicUrl;
  }

  const { error: updateError } = await supabase
    .from("products")
    .update({
      name,
      description: description || null,
      category,
      menu_type: menuType,
      price,
      size: size || null,
      image_url: finalImageUrl,
      featured:
        formData.get("featured") === "on",
      is_new: formData.get("is_new") === "on",
      available:
        formData.get("available") === "on",
      updated_at: new Date().toISOString(),
    })
    .eq("id", productId);

  if (updateError) {
    if (newImagePath) {
      await supabase.storage
        .from("product-images")
        .remove([newImagePath]);
    }

    throw new Error(
      `تعذر تعديل الوجبة: ${updateError.message}`
    );
  }

  if (
    oldImagePath &&
    (newImagePath || removeImage)
  ) {
    await supabase.storage
      .from("product-images")
      .remove([oldImagePath]);
  }

  revalidatePath("/admin");
  revalidatePath("/admin/products");

  redirect("/admin/products");
}