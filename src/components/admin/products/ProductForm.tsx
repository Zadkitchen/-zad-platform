"use client";

import {
  ArrowRight,
  ImagePlus,
  Loader2,
  Save,
  X,
} from "lucide-react";
import Link from "next/link";
import {
  ChangeEvent,
  FormEvent,
  useEffect,
  useState,
} from "react";
import { useFormStatus } from "react-dom";

export type ProductFormData = {
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
};

type ProductFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  initialData?: ProductFormData;
  submitLabel?: string;
};

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-[#d4af37] px-6 font-black text-black transition hover:bg-[#efd46b] disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? (
        <>
          <Loader2 size={20} className="animate-spin" />
          جارٍ الحفظ...
        </>
      ) : (
        <>
          <Save size={20} />
          {label}
        </>
      )}
    </button>
  );
}

export default function ProductForm({
  action,
  initialData,
  submitLabel = "حفظ الوجبة",
}: ProductFormProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    initialData?.image_url ?? null
  );

  const [selectedFileName, setSelectedFileName] =
    useState("");

  const [removeExistingImage, setRemoveExistingImage] =
    useState(false);

  const [price, setPrice] = useState(
    initialData ? String(initialData.price) : ""
  );

  const [formError, setFormError] = useState("");

  useEffect(() => {
    return () => {
      if (previewUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  function handleImageChange(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    setFormError("");

    if (!file) return;

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      event.target.value = "";
      setFormError(
        "صيغة الصورة غير مدعومة. استخدم JPG أو PNG أو WebP."
      );
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      event.target.value = "";
      setFormError(
        "حجم الصورة يجب ألا يتجاوز 5 ميغابايت."
      );
      return;
    }

    if (previewUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }

    setPreviewUrl(URL.createObjectURL(file));
    setSelectedFileName(file.name);
    setRemoveExistingImage(false);
  }

  function removeImage() {
    const input = document.getElementById(
      "product-image"
    ) as HTMLInputElement | null;

    if (input) input.value = "";

    if (previewUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }

    setPreviewUrl(null);
    setSelectedFileName("");
    setRemoveExistingImage(true);
  }

  function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    setFormError("");

    const formData = new FormData(event.currentTarget);

    const name = String(
      formData.get("name") ?? ""
    ).trim();

    const category = String(
      formData.get("category") ?? ""
    ).trim();

    const numericPrice = Number(formData.get("price"));

    if (!name) {
      event.preventDefault();
      setFormError("اكتب اسم الوجبة.");
      return;
    }

    if (!category) {
      event.preventDefault();
      setFormError("اختر تصنيف الوجبة.");
      return;
    }

    if (
      !Number.isFinite(numericPrice) ||
      numericPrice <= 0
    ) {
      event.preventDefault();
      setFormError("أدخل سعرًا صحيحًا أكبر من صفر.");
    }
  }

  return (
    <form
      action={action}
      onSubmit={handleSubmit}
      className="space-y-6"
    >
      <input
        type="hidden"
        name="remove_image"
        value={removeExistingImage ? "true" : "false"}
      />

      {formError && (
        <div className="rounded-2xl border border-red-500/25 bg-red-500/10 p-4 text-sm font-bold text-red-300">
          {formError}
        </div>
      )}

      <section className="rounded-3xl border border-white/10 bg-[#111] p-5 sm:p-6">
        <h2 className="text-xl font-black">صورة الوجبة</h2>

        <p className="mt-2 text-sm text-white/45">
          JPG أو PNG أو WebP، وبحجم أقصى 5 ميغابايت.
        </p>

        <div className="mt-5">
          {previewUrl ? (
            <div className="relative overflow-hidden rounded-3xl border border-white/10">
              <img
                src={previewUrl}
                alt="معاينة صورة الوجبة"
                className="aspect-[16/10] w-full object-cover"
              />

              <button
                type="button"
                onClick={removeImage}
                className="absolute left-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-black/75 transition hover:bg-red-500"
              >
                <X size={20} />
              </button>

              {selectedFileName && (
                <div className="absolute inset-x-0 bottom-0 bg-black/70 px-4 py-3 text-xs text-white/70">
                  {selectedFileName}
                </div>
              )}
            </div>
          ) : (
            <label
              htmlFor="product-image"
              className="flex min-h-64 cursor-pointer flex-col items-center justify-center rounded-3xl border border-dashed border-white/15 bg-white/[0.025] px-5 text-center transition hover:border-[#d4af37]/50"
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#d4af37]/10 text-[#d4af37]">
                <ImagePlus size={30} />
              </div>

              <p className="mt-5 font-black">
                اضغط لاختيار صورة
              </p>
            </label>
          )}

          <input
            id="product-image"
            name="image"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleImageChange}
            className="sr-only"
          />
        </div>
      </section>

      <section className="rounded-3xl border border-white/10 bg-[#111] p-5 sm:p-6">
        <h2 className="text-xl font-black">
          معلومات الوجبة
        </h2>

        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-2 block text-sm font-bold text-white/70">
              اسم الوجبة
            </label>

            <input
              name="name"
              type="text"
              required
              maxLength={120}
              defaultValue={initialData?.name ?? ""}
              placeholder="مثال: ريزو دجاج"
              className="h-14 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 outline-none focus:border-[#d4af37]/60"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="mb-2 block text-sm font-bold text-white/70">
              وصف الوجبة
            </label>

            <textarea
              name="description"
              rows={4}
              maxLength={500}
              defaultValue={initialData?.description ?? ""}
              placeholder="اكتب وصفًا مختصرًا للوجبة..."
              className="w-full resize-none rounded-2xl border border-white/10 bg-white/[0.04] p-4 outline-none focus:border-[#d4af37]/60"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-white/70">
              التصنيف
            </label>

            <select
              name="category"
              required
              defaultValue={initialData?.category ?? ""}
              className="h-14 w-full rounded-2xl border border-white/10 bg-[#171717] px-4 outline-none"
            >
              <option value="" disabled>
                اختر التصنيف
              </option>
              <option value="غداء عراقي">غداء عراقي</option>
              <option value="ريزو">ريزو</option>
              <option value="كرسبي">كرسبي</option>
              <option value="بركر">بركر</option>
              <option value="شاورما">شاورما</option>
              <option value="بيتزا">بيتزا</option>
              <option value="وجبات عائلية">
                وجبات عائلية
              </option>
              <option value="إضافات">إضافات</option>
              <option value="مشروبات">مشروبات</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-white/70">
              فترة المنيو
            </label>

            <select
              name="menu_type"
              defaultValue={
                initialData?.menu_type ?? "evening"
              }
              className="h-14 w-full rounded-2xl border border-white/10 bg-[#171717] px-4 outline-none"
            >
              <option value="lunch">الفترة الصباحية</option>
              <option value="evening">الفترة المسائية</option>
              <option value="both">الفترتان</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-white/70">
              السعر بالدينار العراقي
            </label>

            <input
              name="price"
              type="number"
              required
              min="1"
              step="1"
              value={price}
              onChange={(event) =>
                setPrice(event.target.value)
              }
              placeholder="مثال: 8000"
              className="h-14 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-left outline-none focus:border-[#d4af37]/60"
            />

            {price && Number(price) > 0 && (
              <p className="mt-2 text-xs font-bold text-[#d4af37]">
                {new Intl.NumberFormat("ar-US").format(
                  Number(price)
                )}{" "}
                د.ع
              </p>
            )}
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-white/70">
              الحجم
            </label>

            <input
              name="size"
              type="text"
              maxLength={50}
              defaultValue={initialData?.size ?? ""}
              placeholder="مثال: عادي، وسط، كبير"
              className="h-14 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 outline-none focus:border-[#d4af37]/60"
            />
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-white/10 bg-[#111] p-5 sm:p-6">
        <h2 className="text-xl font-black">حالة الوجبة</h2>

        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-white/10 p-4">
            <input
              type="checkbox"
              name="available"
              defaultChecked={
                initialData?.available ?? true
              }
              className="h-5 w-5 accent-[#d4af37]"
            />
            <span className="font-black">متوفرة</span>
          </label>

          <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-white/10 p-4">
            <input
              type="checkbox"
              name="featured"
              defaultChecked={
                initialData?.featured ?? false
              }
              className="h-5 w-5 accent-[#d4af37]"
            />
            <span className="font-black">الأكثر طلبًا</span>
          </label>

          <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-white/10 p-4">
            <input
              type="checkbox"
              name="is_new"
              defaultChecked={initialData?.is_new ?? false}
              className="h-5 w-5 accent-[#d4af37]"
            />
            <span className="font-black">وجبة جديدة</span>
          </label>
        </div>
      </section>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Link
          href="/admin/products"
          className="flex h-14 items-center justify-center gap-2 rounded-2xl border border-white/10 px-6 font-black text-white/65"
        >
          <ArrowRight size={19} />
          إلغاء
        </Link>

        <SubmitButton label={submitLabel} />
      </div>
    </form>
  );
}