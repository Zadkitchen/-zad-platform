import {
  ArrowRight,
  BadgePercent,
  Clock3,
  Contact,
  MapPin,
  Megaphone,
  MessageCircle,
  Save,
  Settings,
  ShoppingBag,
  Star,
  Store,
  Truck,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { createClient } from "../../../lib/supabase/server";
import { updatePlatformSettings } from "./actions";

type SettingsPageProps = {
  searchParams: Promise<{
    success?: string;
    error?: string;
  }>;
};

type PlatformSettings = {
  id: number;
  restaurant_name: string;
  slogan: string;
  whatsapp_number: string;
  phone_number: string | null;
  address: string | null;
  google_maps_url: string | null;
  instagram_url: string | null;
  facebook_url: string | null;
  accepting_orders: boolean;
  kitchen_open: boolean;
  morning_shift_enabled: boolean;
  morning_start: string;
  morning_end: string;
  evening_shift_enabled: boolean;
  evening_start: string;
  evening_end: string;
  delivery_enabled: boolean;
  kitchen_latitude: number;
  kitchen_longitude: number;
  delivery_base_distance_km: number;
  delivery_base_fee: number;
  delivery_step_distance_km: number;
  delivery_step_fee: number;
  delivery_max_distance_km: number;
  minimum_order: number;
  free_delivery_threshold: number;

  global_offer_enabled: boolean;
  global_offer_name: string;
  global_offer_type: "percentage" | "fixed";
  global_offer_value: number;
  global_offer_starts_at: string | null;
  global_offer_ends_at: string | null;
  global_offer_min_item_price: number;
  global_offer_exclude_addons: boolean;
  global_offer_exclude_drinks: boolean;

  loyalty_enabled: boolean;
  loyalty_required_orders: number;
  loyalty_discount_type: "percentage" | "fixed";
  loyalty_discount_value: number;
  loyalty_max_discount: number;
  loyalty_min_order_amount: number;
  loyalty_include_delivery: boolean;

  banner_enabled: boolean;
  banner_text: string | null;
  closed_message: string;
  orders_paused_message: string;
};

const inputClass =
  "mt-2 h-14 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-white outline-none transition placeholder:text-white/20 focus:border-[#d4af37]/60";

const textareaClass =
  "mt-2 min-h-28 w-full resize-y rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-white outline-none transition placeholder:text-white/20 focus:border-[#d4af37]/60";

const sectionClass =
  "rounded-3xl border border-white/10 bg-[#111] p-5 sm:p-6";

function cleanTime(value: string | null | undefined) {
  return value?.slice(0, 5) || "";
}

function cleanDateTimeLocal(
  value: string | null | undefined
) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const localTime = new Date(
    date.getTime() - date.getTimezoneOffset() * 60000
  );

  return localTime.toISOString().slice(0, 16);
}

export default async function AdminSettingsPage({
  searchParams,
}: SettingsPageProps) {
  const params = await searchParams;
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
    await supabase.auth.signOut();
    redirect("/admin/login");
  }

  const { data, error } = await supabase
    .from("platform_settings")
    .select("*")
    .eq("id", 1)
    .maybeSingle();

  if (error) {
    throw new Error(
      `تعذر تحميل إعدادات المنصة: ${error.message}`
    );
  }

  const settings: PlatformSettings = {
    id: 1,
    restaurant_name:
      data?.restaurant_name ?? "مطبخ زاد",
    slogan:
      data?.slogan ?? "زاد... نكهة تستحق العودة",
    whatsapp_number:
      data?.whatsapp_number ?? "9647700000000",
    phone_number: data?.phone_number ?? "",
    address: data?.address ?? "",
    google_maps_url: data?.google_maps_url ?? "",
    instagram_url: data?.instagram_url ?? "",
    facebook_url: data?.facebook_url ?? "",
    accepting_orders: data?.accepting_orders ?? true,
    kitchen_open: data?.kitchen_open ?? true,
    morning_shift_enabled:
      data?.morning_shift_enabled ?? true,
    morning_start: data?.morning_start ?? "10:30",
    morning_end: data?.morning_end ?? "15:00",
    evening_shift_enabled:
      data?.evening_shift_enabled ?? true,
    evening_start: data?.evening_start ?? "16:00",
    evening_end: data?.evening_end ?? "00:00",
    delivery_enabled: data?.delivery_enabled ?? true,
    kitchen_latitude:
      Number(data?.kitchen_latitude) || 30.4745,
    kitchen_longitude:
      Number(data?.kitchen_longitude) || 47.805556,
    delivery_base_distance_km:
      Number(data?.delivery_base_distance_km) || 5,
    delivery_base_fee:
      Number(data?.delivery_base_fee) || 1000,
    delivery_step_distance_km:
      Number(data?.delivery_step_distance_km) || 5,
    delivery_step_fee:
      Number(data?.delivery_step_fee) || 1000,
    delivery_max_distance_km:
      Number(data?.delivery_max_distance_km) || 20,
    minimum_order: data?.minimum_order ?? 5000,
    free_delivery_threshold:
      data?.free_delivery_threshold ?? 0,

    global_offer_enabled:
      data?.global_offer_enabled ?? false,
    global_offer_name:
      data?.global_offer_name ?? "عرض زاد",
    global_offer_type:
      data?.global_offer_type === "fixed"
        ? "fixed"
        : "percentage",
    global_offer_value:
      Number(data?.global_offer_value) || 0,
    global_offer_starts_at:
      data?.global_offer_starts_at ?? null,
    global_offer_ends_at:
      data?.global_offer_ends_at ?? null,
    global_offer_min_item_price:
      Number(data?.global_offer_min_item_price) || 0,
    global_offer_exclude_addons:
      data?.global_offer_exclude_addons ?? true,
    global_offer_exclude_drinks:
      data?.global_offer_exclude_drinks ?? true,

    loyalty_enabled:
      data?.loyalty_enabled ?? false,
    loyalty_required_orders:
      Number(data?.loyalty_required_orders) || 5,
    loyalty_discount_type:
      data?.loyalty_discount_type === "fixed"
        ? "fixed"
        : "percentage",
    loyalty_discount_value:
      Number(data?.loyalty_discount_value) || 0,
    loyalty_max_discount:
      Number(data?.loyalty_max_discount) || 0,
    loyalty_min_order_amount:
      Number(data?.loyalty_min_order_amount) || 0,
    loyalty_include_delivery:
      data?.loyalty_include_delivery ?? false,

    banner_enabled: data?.banner_enabled ?? false,
    banner_text: data?.banner_text ?? "",
    closed_message:
      data?.closed_message ??
      "نعتذر، المطبخ مغلق حالياً.",
    orders_paused_message:
      data?.orders_paused_message ??
      "نعتذر، تم إيقاف استقبال الطلبات مؤقتاً.",
  };

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-[#070707] px-4 py-6 text-white sm:px-6"
    >
      <div className="mx-auto max-w-6xl">
        <header className={sectionClass}>
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
            تحكم باسم المطبخ وأوقات العمل والطلبات
            والتوصيل والتواصل والإعلانات.
          </p>
        </header>

        {params.success && (
          <div className="mt-5 rounded-2xl border border-green-500/20 bg-green-500/10 p-4 font-bold text-green-300">
            {params.success}
          </div>
        )}

        {params.error && (
          <div className="mt-5 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 font-bold text-red-300">
            {params.error}
          </div>
        )}

        <form
          action={updatePlatformSettings}
          className="mt-6 space-y-6"
        >
          <section className={sectionClass}>
            <SectionTitle
              icon={Store}
              title="معلومات المطبخ"
              description="الاسم والشعار والعنوان الظاهر للزبائن."
            />

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <Field label="اسم المطبخ">
                <input
                  name="restaurant_name"
                  required
                  defaultValue={settings.restaurant_name}
                  className={inputClass}
                />
              </Field>

              <Field label="الشعار النصي">
                <input
                  name="slogan"
                  defaultValue={settings.slogan}
                  className={inputClass}
                />
              </Field>

              <Field
                label="عنوان المطبخ"
                className="md:col-span-2"
              >
                <input
                  name="address"
                  defaultValue={settings.address ?? ""}
                  placeholder="البصرة، المنطقة والشارع"
                  className={inputClass}
                />
              </Field>

              <Field
                label="رابط الموقع على Google Maps"
                className="md:col-span-2"
              >
                <input
                  name="google_maps_url"
                  type="url"
                  defaultValue={
                    settings.google_maps_url ?? ""
                  }
                  placeholder="https://..."
                  className={inputClass}
                  dir="ltr"
                />
              </Field>
            </div>
          </section>

          <section className={sectionClass}>
            <SectionTitle
              icon={ShoppingBag}
              title="حالة المطبخ والطلبات"
              description="تشغيل أو إيقاف المطبخ واستقبال الطلبات فورًا."
            />

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <ToggleCard
                name="kitchen_open"
                title="المطبخ مفتوح"
                description="عند الإيقاف يظهر للزبون أن المطبخ مغلق."
                defaultChecked={settings.kitchen_open}
              />

              <ToggleCard
                name="accepting_orders"
                title="استقبال الطلبات"
                description="أوقفه مؤقتًا عند ضغط الطلبات أو نفاد المواد."
                defaultChecked={
                  settings.accepting_orders
                }
              />
            </div>

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <Field label="رسالة إغلاق المطبخ">
                <textarea
                  name="closed_message"
                  defaultValue={settings.closed_message}
                  className={textareaClass}
                />
              </Field>

              <Field label="رسالة إيقاف الطلبات">
                <textarea
                  name="orders_paused_message"
                  defaultValue={
                    settings.orders_paused_message
                  }
                  className={textareaClass}
                />
              </Field>
            </div>
          </section>

          <section className={sectionClass}>
            <SectionTitle
              icon={Clock3}
              title="أوقات العمل"
              description="حدد أوقات الفترتين الصباحية والمسائية."
            />

            <div className="mt-6 space-y-5">
              <ShiftCard
                title="الفترة الصباحية"
                enabledName="morning_shift_enabled"
                enabled={
                  settings.morning_shift_enabled
                }
                startName="morning_start"
                startValue={cleanTime(
                  settings.morning_start
                )}
                endName="morning_end"
                endValue={cleanTime(
                  settings.morning_end
                )}
              />

              <ShiftCard
                title="الفترة المسائية"
                enabledName="evening_shift_enabled"
                enabled={
                  settings.evening_shift_enabled
                }
                startName="evening_start"
                startValue={cleanTime(
                  settings.evening_start
                )}
                endName="evening_end"
                endValue={cleanTime(
                  settings.evening_end
                )}
              />
            </div>
          </section>

          <section className={sectionClass}>
            <SectionTitle
              icon={Truck}
              title="إعدادات التوصيل"
              description="احتساب أجرة التوصيل تلقائيًا حسب موقع الزبون والمسافة."
            />

            <div className="mt-6">
              <ToggleCard
                name="delivery_enabled"
                title="تفعيل خدمة التوصيل"
                description="عند الإيقاف لن يتمكن الزبون من إكمال طلب توصيل."
                defaultChecked={settings.delivery_enabled}
              />
            </div>

            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <DecimalField
                name="kitchen_latitude"
                label="خط عرض المطبخ"
                defaultValue={settings.kitchen_latitude}
              />

              <DecimalField
                name="kitchen_longitude"
                label="خط طول المطبخ"
                defaultValue={settings.kitchen_longitude}
              />

              <DistanceField
                name="delivery_base_distance_km"
                label="مسافة الشريحة الأولى"
                defaultValue={settings.delivery_base_distance_km}
              />

              <NumberField
                name="delivery_base_fee"
                label="أجرة الشريحة الأولى"
                defaultValue={settings.delivery_base_fee}
              />

              <DistanceField
                name="delivery_step_distance_km"
                label="مسافة كل شريحة إضافية"
                defaultValue={settings.delivery_step_distance_km}
              />

              <NumberField
                name="delivery_step_fee"
                label="أجرة كل شريحة إضافية"
                defaultValue={settings.delivery_step_fee}
              />

              <DistanceField
                name="delivery_max_distance_km"
                label="أقصى مسافة للتوصيل"
                defaultValue={settings.delivery_max_distance_km}
              />

              <NumberField
                name="minimum_order"
                label="الحد الأدنى للطلب"
                defaultValue={settings.minimum_order}
              />

              <NumberField
                name="free_delivery_threshold"
                label="توصيل مجاني عند بلوغ"
                defaultValue={settings.free_delivery_threshold}
                helper="اكتب صفر لتعطيل التوصيل المجاني."
              />
            </div>

            <div className="mt-5 rounded-2xl border border-[#d4af37]/20 bg-[#d4af37]/5 p-4 text-sm leading-7 text-white/55">
              الإعداد الحالي: أول {settings.delivery_base_distance_km} كم بسعر{" "}
              {new Intl.NumberFormat("en-US").format(settings.delivery_base_fee)} د.ع،
              وبعدها كل {settings.delivery_step_distance_km} كم تضاف{" "}
              {new Intl.NumberFormat("en-US").format(settings.delivery_step_fee)} د.ع،
              وبحد أقصى {settings.delivery_max_distance_km} كم.
            </div>
          </section>

          <section className={sectionClass}>
            <SectionTitle
              icon={BadgePercent}
              title="العروض العامة"
              description="فعّل عرضًا واحدًا يطبق تلقائيًا على جميع الوجبات المؤهلة."
            />

            <div className="mt-6">
              <ToggleCard
                name="global_offer_enabled"
                title="تفعيل العرض العام"
                description="عند التفعيل يظهر السعر القديم والجديد داخل المنيو ويُعتمد السعر المخفّض في الطلب."
                defaultChecked={settings.global_offer_enabled}
              />
            </div>

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <Field label="اسم العرض">
                <input
                  name="global_offer_name"
                  defaultValue={settings.global_offer_name}
                  placeholder="مثال: عرض الافتتاح"
                  className={inputClass}
                />
              </Field>

              <Field label="نوع الخصم">
                <select
                  name="global_offer_type"
                  defaultValue={settings.global_offer_type}
                  className={`${inputClass} bg-[#171717]`}
                >
                  <option value="percentage">
                    نسبة مئوية %
                  </option>
                  <option value="fixed">
                    مبلغ ثابت من كل وجبة
                  </option>
                </select>
              </Field>

              <NumberField
                name="global_offer_value"
                label="قيمة الخصم"
                defaultValue={settings.global_offer_value}
                helper="إذا اخترت نسبة، اكتب مثلًا 20. وإذا اخترت مبلغًا ثابتًا، اكتب مثلًا 2000."
              />

              <NumberField
                name="global_offer_min_item_price"
                label="أقل سعر وجبة لتطبيق العرض"
                defaultValue={settings.global_offer_min_item_price}
                helper="اكتب صفر لتطبيق العرض على كل الأسعار."
              />

              <Field label="بداية العرض">
                <input
                  name="global_offer_starts_at"
                  type="datetime-local"
                  defaultValue={cleanDateTimeLocal(
                    settings.global_offer_starts_at
                  )}
                  className={inputClass}
                />
              </Field>

              <Field label="نهاية العرض">
                <input
                  name="global_offer_ends_at"
                  type="datetime-local"
                  defaultValue={cleanDateTimeLocal(
                    settings.global_offer_ends_at
                  )}
                  className={inputClass}
                />
              </Field>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <ToggleCard
                name="global_offer_exclude_addons"
                title="استثناء الإضافات"
                description="لا يطبق العرض على تصنيف إضافات."
                defaultChecked={
                  settings.global_offer_exclude_addons
                }
              />

              <ToggleCard
                name="global_offer_exclude_drinks"
                title="استثناء المشروبات"
                description="لا يطبق العرض على تصنيف مشروبات."
                defaultChecked={
                  settings.global_offer_exclude_drinks
                }
              />
            </div>
          </section>

          <section className={sectionClass}>
            <SectionTitle
              icon={Star}
              title="برنامج الولاء"
              description="احتساب الطلبات المسلّمة لكل رقم هاتف ومنح خصم تلقائي عند استحقاق المكافأة."
            />

            <div className="mt-6">
              <ToggleCard
                name="loyalty_enabled"
                title="تفعيل برنامج الولاء"
                description="يحسب الطلبات التي حالتها تم التسليم فقط."
                defaultChecked={settings.loyalty_enabled}
              />
            </div>

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <NumberField
                name="loyalty_required_orders"
                label="عدد الطلبات المطلوبة"
                defaultValue={settings.loyalty_required_orders}
                helper="مثال: 5 يعني أن الطلب السادس يحصل على الخصم."
              />

              <Field label="نوع خصم الولاء">
                <select
                  name="loyalty_discount_type"
                  defaultValue={settings.loyalty_discount_type}
                  className={`${inputClass} bg-[#171717]`}
                >
                  <option value="percentage">
                    نسبة مئوية %
                  </option>
                  <option value="fixed">
                    مبلغ ثابت
                  </option>
                </select>
              </Field>

              <NumberField
                name="loyalty_discount_value"
                label="قيمة خصم الولاء"
                defaultValue={settings.loyalty_discount_value}
              />

              <NumberField
                name="loyalty_max_discount"
                label="الحد الأعلى للخصم"
                defaultValue={settings.loyalty_max_discount}
                helper="مهم عند استخدام خصم نسبة. اكتب صفر لإلغاء الحد."
              />

              <NumberField
                name="loyalty_min_order_amount"
                label="أقل قيمة طلب لاستحقاق الخصم"
                defaultValue={settings.loyalty_min_order_amount}
              />

              <div className="md:pt-7">
                <ToggleCard
                  name="loyalty_include_delivery"
                  title="خصم الولاء يشمل التوصيل"
                  description="عند الإيقاف يطبق الخصم على الوجبات فقط."
                  defaultChecked={
                    settings.loyalty_include_delivery
                  }
                />
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-[#d4af37]/20 bg-[#d4af37]/5 p-4 text-sm leading-7 text-white/55">
              كل رقم هاتف يكمل{" "}
              {settings.loyalty_required_orders} طلبات مسلّمة
              يحصل تلقائيًا على المكافأة في الطلب التالي.
            </div>
          </section>

          <section className={sectionClass}>
            <SectionTitle
              icon={Contact}
              title="التواصل"
              description="الأرقام وروابط حسابات مطبخ زاد."
            />

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <Field label="رقم الواتساب">
                <input
                  name="whatsapp_number"
                  required
                  inputMode="numeric"
                  defaultValue={
                    settings.whatsapp_number
                  }
                  placeholder="96477xxxxxxxx"
                  className={inputClass}
                  dir="ltr"
                />
              </Field>

              <Field label="رقم الهاتف">
                <input
                  name="phone_number"
                  inputMode="tel"
                  defaultValue={
                    settings.phone_number ?? ""
                  }
                  className={inputClass}
                  dir="ltr"
                />
              </Field>

              <Field label="رابط إنستغرام">
                <input
                  name="instagram_url"
                  type="url"
                  defaultValue={
                    settings.instagram_url ?? ""
                  }
                  placeholder="https://..."
                  className={inputClass}
                  dir="ltr"
                />
              </Field>

              <Field label="رابط فيسبوك">
                <input
                  name="facebook_url"
                  type="url"
                  defaultValue={
                    settings.facebook_url ?? ""
                  }
                  placeholder="https://..."
                  className={inputClass}
                  dir="ltr"
                />
              </Field>
            </div>
          </section>

          <section className={sectionClass}>
            <SectionTitle
              icon={Megaphone}
              title="الإعلان أعلى المنصة"
              description="رسالة تظهر للزبائن في أعلى الموقع."
            />

            <div className="mt-6">
              <ToggleCard
                name="banner_enabled"
                title="إظهار الإعلان"
                description="يمكنك إخفاؤه دون حذف النص."
                defaultChecked={
                  settings.banner_enabled
                }
              />

              <Field
                label="نص الإعلان"
                className="mt-5"
              >
                <textarea
                  name="banner_text"
                  defaultValue={
                    settings.banner_text ?? ""
                  }
                  placeholder="مثال: التوصيل مجاني للطلبات فوق 20,000 د.ع"
                  className={textareaClass}
                />
              </Field>
            </div>
          </section>

          <div className="sticky bottom-4 z-20 rounded-3xl border border-[#d4af37]/25 bg-[#111]/95 p-3 shadow-2xl backdrop-blur">
            <button
              type="submit"
              className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#d4af37] font-black text-black transition hover:bg-[#efd46b] active:scale-[0.99]"
            >
              <Save size={20} />
              حفظ جميع الإعدادات
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}

function SectionTitle({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof Settings;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-4">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#d4af37]/10 text-[#d4af37]">
        <Icon size={22} />
      </div>

      <div>
        <h2 className="text-xl font-black">{title}</h2>
        <p className="mt-1 text-sm leading-6 text-white/45">
          {description}
        </p>
      </div>
    </div>
  );
}

function Field({
  label,
  className = "",
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label
      className={`block text-sm font-bold text-white/70 ${className}`}
    >
      {label}
      {children}
    </label>
  );
}

function NumberField({
  name,
  label,
  defaultValue,
  helper,
}: {
  name: string;
  label: string;
  defaultValue: number;
  helper?: string;
}) {
  return (
    <Field label={label}>
      <div className="relative">
        <input
          name={name}
          type="number"
          min="0"
          step="250"
          required
          defaultValue={defaultValue}
          className={`${inputClass} pl-16`}
        />

        <span className="absolute bottom-4 left-4 text-xs font-bold text-white/30">
          د.ع
        </span>
      </div>

      {helper && (
        <span className="mt-2 block text-xs text-white/35">
          {helper}
        </span>
      )}
    </Field>
  );
}

function DecimalField({
  name,
  label,
  defaultValue,
}: {
  name: string;
  label: string;
  defaultValue: number;
}) {
  return (
    <Field label={label}>
      <input
        name={name}
        type="number"
        step="0.000001"
        inputMode="decimal"
        required
        defaultValue={defaultValue}
        className={inputClass}
        dir="ltr"
      />
    </Field>
  );
}
function DistanceField({
  name,
  label,
  defaultValue,
}: {
  name: string;
  label: string;
  defaultValue: number;
}) {
  return (
    <Field label={label}>
      <div className="relative">
        <input
          name={name}
          type="number"
          min="0"
          step="any"
          inputMode="decimal"
          required
          defaultValue={defaultValue}
          className={`${inputClass} pl-14`}
          dir="ltr"
        />

        <span className="absolute bottom-4 left-4 text-xs font-bold text-white/30">
          كم
        </span>
      </div>
    </Field>
  );
}

function ToggleCard({
  name,
  title,
  description,
  defaultChecked,
}: {
  name: string;
  title: string;
  description: string;
  defaultChecked: boolean;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div>
        <p className="font-black">{title}</p>
        <p className="mt-1 text-sm leading-6 text-white/40">
          {description}
        </p>
      </div>

      <input
        name={name}
        type="checkbox"
        defaultChecked={defaultChecked}
        className="h-6 w-6 shrink-0 accent-[#d4af37]"
      />
    </label>
  );
}

function ShiftCard({
  title,
  enabledName,
  enabled,
  startName,
  startValue,
  endName,
  endValue,
}: {
  title: string;
  enabledName: string;
  enabled: boolean;
  startName: string;
  startValue: string;
  endName: string;
  endValue: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="flex items-center justify-between gap-4">
        <h3 className="font-black">{title}</h3>

        <label className="flex items-center gap-2 text-sm font-bold text-white/60">
          تفعيل
          <input
            name={enabledName}
            type="checkbox"
            defaultChecked={enabled}
            className="h-5 w-5 accent-[#d4af37]"
          />
        </label>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Field label="من">
          <input
            name={startName}
            type="time"
            required
            defaultValue={startValue}
            className={inputClass}
          />
        </Field>

        <Field label="إلى">
          <input
            name={endName}
            type="time"
            required
            defaultValue={endValue}
            className={inputClass}
          />
        </Field>
      </div>
    </div>
  );
}