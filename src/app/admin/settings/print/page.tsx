"use client";

import { useEffect, useState } from "react";
import {
  CheckCircle2,
  ChefHat,
  Loader2,
  Printer,
  ReceiptText,
  Save,
  Truck,
} from "lucide-react";

type PaperSize = "58mm" | "80mm";

type PrintOrder =
  | "kitchen_first"
  | "customer_first"
  | "driver_first";

type PrinterConnection =
  | "not_connected"
  | "usb"
  | "network"
  | "wifi";

type PrintSettings = {
  id: number;

  auto_print_enabled: boolean;

  paper_size: PaperSize;

  kitchen_copy_enabled: boolean;
  kitchen_copy_count: number;

  customer_copy_enabled: boolean;
  customer_copy_count: number;

  driver_copy_enabled: boolean;
  driver_copy_count: number;

  print_order: PrintOrder;

  printer_name: string | null;
  printer_connection: PrinterConnection;

  created_at?: string;
  updated_at?: string;
};

const defaultSettings: PrintSettings = {
  id: 0,

  auto_print_enabled: false,

  paper_size: "80mm",

  kitchen_copy_enabled: true,
  kitchen_copy_count: 1,

  customer_copy_enabled: true,
  customer_copy_count: 1,

  driver_copy_enabled: false,
  driver_copy_count: 0,

  print_order: "kitchen_first",

  printer_name: null,
  printer_connection: "not_connected",
};

function clampCopyCount(value: number) {
  return Math.min(5, Math.max(0, value));
}

export default function PrintSettingsPage() {
  const [settings, setSettings] =
    useState<PrintSettings>(defaultSettings);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    void loadSettings();
  }, []);

  async function loadSettings() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        "/api/admin/print-settings",
        {
          method: "GET",
          cache: "no-store",
        },
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || "تعذر تحميل إعدادات الطباعة",
        );
      }

      setSettings(result.settings);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "تعذر تحميل إعدادات الطباعة",
      );
    } finally {
      setLoading(false);
    }
  }

  async function saveSettings() {
    setSaving(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch(
        "/api/admin/print-settings",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(settings),
        },
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || "تعذر حفظ إعدادات الطباعة",
        );
      }

      setSettings(result.settings);
      setMessage(
        result.message ||
          "تم حفظ إعدادات الطباعة بنجاح",
      );
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "تعذر حفظ إعدادات الطباعة",
      );
    } finally {
      setSaving(false);
    }
  }

  function updateCopyCount(
    field:
      | "kitchen_copy_count"
      | "customer_copy_count"
      | "driver_copy_count",
    amount: number,
  ) {
    setSettings((current) => ({
      ...current,
      [field]: clampCopyCount(
        current[field] + amount,
      ),
    }));
  }

  function toggleCopy(
    enabledField:
      | "kitchen_copy_enabled"
      | "customer_copy_enabled"
      | "driver_copy_enabled",
    countField:
      | "kitchen_copy_count"
      | "customer_copy_count"
      | "driver_copy_count",
  ) {
    setSettings((current) => {
      const nextEnabled = !current[enabledField];

      return {
        ...current,
        [enabledField]: nextEnabled,
        [countField]: nextEnabled
          ? Math.max(1, current[countField])
          : 0,
      };
    });
  }

  if (loading) {
    return (
      <main
        dir="rtl"
        className="flex min-h-[60vh] items-center justify-center"
      >
        <div className="flex items-center gap-3 text-zinc-600">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>جاري تحميل إعدادات الطباعة...</span>
        </div>
      </main>
    );
  }

  return (
    <main
      dir="rtl"
      className="mx-auto w-full max-w-5xl space-y-6 px-4 py-6 sm:px-6"
    >
      <header className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-start gap-4">
            <div className="rounded-2xl bg-amber-100 p-3 text-amber-700">
              <Printer className="h-7 w-7" />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-zinc-900">
                إعدادات الطباعة
              </h1>

              <p className="mt-1 text-sm leading-6 text-zinc-500">
                تحكم بالطباعة التلقائية، حجم الورق
                وعدد نسخ الفواتير.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={saveSettings}
            disabled={saving}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-zinc-900 px-6 font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Save className="h-5 w-5" />
            )}

            {saving ? "جاري الحفظ..." : "حفظ الإعدادات"}
          </button>
        </div>
      </header>

      {message ? (
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          <span>{message}</span>
        </div>
      ) : null}

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
          {error}
        </div>
      ) : null}

      <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="font-bold text-zinc-900">
              الطباعة التلقائية
            </h2>

            <p className="mt-1 text-sm text-zinc-500">
              عند تفعيلها ستتم طباعة الطلب الجديد
              تلقائيًا بعد ربط الطابعة.
            </p>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={settings.auto_print_enabled}
            onClick={() =>
              setSettings((current) => ({
                ...current,
                auto_print_enabled:
                  !current.auto_print_enabled,
              }))
            }
            className={`relative h-8 w-14 shrink-0 rounded-full transition ${
              settings.auto_print_enabled
                ? "bg-emerald-500"
                : "bg-zinc-300"
            }`}
          >
            <span
              className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition ${
                settings.auto_print_enabled
                  ? "right-7"
                  : "right-1"
              }`}
            />
          </button>
        </div>
      </section>

      <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="font-bold text-zinc-900">
          حجم ورق الطابعة
        </h2>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {(["58mm", "80mm"] as PaperSize[]).map(
            (size) => (
              <button
                key={size}
                type="button"
                onClick={() =>
                  setSettings((current) => ({
                    ...current,
                    paper_size: size,
                  }))
                }
                className={`rounded-2xl border p-5 text-right transition ${
                  settings.paper_size === size
                    ? "border-amber-500 bg-amber-50"
                    : "border-zinc-200 hover:border-zinc-300"
                }`}
              >
                <div className="text-lg font-bold text-zinc-900">
                  {size}
                </div>

                <div className="mt-1 text-sm text-zinc-500">
                  {size === "80mm"
                    ? "المقاس الأنسب لفواتير زاد"
                    : "مقاس صغير واقتصادي"}
                </div>
              </button>
            ),
          )}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <CopyCard
          title="نسخة المطبخ"
          description="تحتوي على تفاصيل التحضير والملاحظات."
          icon={<ChefHat className="h-6 w-6" />}
          enabled={settings.kitchen_copy_enabled}
          count={settings.kitchen_copy_count}
          onToggle={() =>
            toggleCopy(
              "kitchen_copy_enabled",
              "kitchen_copy_count",
            )
          }
          onDecrease={() =>
            updateCopyCount("kitchen_copy_count", -1)
          }
          onIncrease={() =>
            updateCopyCount("kitchen_copy_count", 1)
          }
        />

        <CopyCard
          title="نسخة الزبون"
          description="تحتوي على الأسعار والتوصيل والمجموع."
          icon={<ReceiptText className="h-6 w-6" />}
          enabled={settings.customer_copy_enabled}
          count={settings.customer_copy_count}
          onToggle={() =>
            toggleCopy(
              "customer_copy_enabled",
              "customer_copy_count",
            )
          }
          onDecrease={() =>
            updateCopyCount("customer_copy_count", -1)
          }
          onIncrease={() =>
            updateCopyCount("customer_copy_count", 1)
          }
        />

        <CopyCard
          title="نسخة السائق"
          description="تحتوي على بيانات الزبون والعنوان."
          icon={<Truck className="h-6 w-6" />}
          enabled={settings.driver_copy_enabled}
          count={settings.driver_copy_count}
          onToggle={() =>
            toggleCopy(
              "driver_copy_enabled",
              "driver_copy_count",
            )
          }
          onDecrease={() =>
            updateCopyCount("driver_copy_count", -1)
          }
          onIncrease={() =>
            updateCopyCount("driver_copy_count", 1)
          }
        />
      </section>

      <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
        <label
          htmlFor="print-order"
          className="font-bold text-zinc-900"
        >
          ترتيب طباعة النسخ
        </label>

        <select
          id="print-order"
          value={settings.print_order}
          onChange={(event) =>
            setSettings((current) => ({
              ...current,
              print_order: event.target
                .value as PrintOrder,
            }))
          }
          className="mt-4 h-12 w-full rounded-2xl border border-zinc-200 bg-white px-4 outline-none transition focus:border-amber-500"
        >
          <option value="kitchen_first">
            نسخة المطبخ أولًا
          </option>

          <option value="customer_first">
            نسخة الزبون أولًا
          </option>

          <option value="driver_first">
            نسخة السائق أولًا
          </option>
        </select>
      </section>

      <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="font-bold text-zinc-900">
          حالة الطابعة
        </h2>

        <div className="mt-4 flex items-center justify-between gap-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
          <div className="flex items-center gap-3">
            <span
              className={`h-3 w-3 rounded-full ${
                settings.printer_connection ===
                "not_connected"
                  ? "bg-zinc-400"
                  : "bg-emerald-500"
              }`}
            />

            <div>
              <div className="font-semibold text-zinc-900">
                {settings.printer_name ||
                  "لا توجد طابعة متصلة"}
              </div>

              <div className="mt-1 text-sm text-zinc-500">
                {getConnectionLabel(
                  settings.printer_connection,
                )}
              </div>
            </div>
          </div>

          <Printer className="h-6 w-6 text-zinc-400" />
        </div>

        <p className="mt-3 text-sm leading-6 text-zinc-500">
          ربط الطابعة الفعلي سيتم بعد توفير الطابعة
          وتثبيت برنامج الطباعة على جهاز المطبخ.
        </p>
      </section>
    </main>
  );
}

type CopyCardProps = {
  title: string;
  description: string;
  icon: React.ReactNode;
  enabled: boolean;
  count: number;
  onToggle: () => void;
  onDecrease: () => void;
  onIncrease: () => void;
};

function CopyCard({
  title,
  description,
  icon,
  enabled,
  count,
  onToggle,
  onDecrease,
  onIncrease,
}: CopyCardProps) {
  return (
    <article
      className={`rounded-3xl border bg-white p-5 shadow-sm transition ${
        enabled
          ? "border-amber-300"
          : "border-zinc-200 opacity-75"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="rounded-2xl bg-amber-100 p-3 text-amber-700">
          {icon}
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          onClick={onToggle}
          className={`relative h-7 w-12 rounded-full transition ${
            enabled ? "bg-emerald-500" : "bg-zinc-300"
          }`}
        >
          <span
            className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition ${
              enabled ? "right-6" : "right-1"
            }`}
          />
        </button>
      </div>

      <h3 className="mt-4 font-bold text-zinc-900">
        {title}
      </h3>

      <p className="mt-1 min-h-12 text-sm leading-6 text-zinc-500">
        {description}
      </p>

      <div className="mt-5">
        <div className="mb-2 text-sm font-medium text-zinc-600">
          عدد النسخ
        </div>

        <div className="flex h-12 items-center justify-between rounded-2xl border border-zinc-200 bg-zinc-50 px-2">
          <button
            type="button"
            onClick={onDecrease}
            disabled={!enabled || count <= 1}
            className="h-9 w-9 rounded-xl bg-white text-lg font-bold shadow-sm disabled:cursor-not-allowed disabled:opacity-40"
          >
            −
          </button>

          <span className="text-lg font-bold text-zinc-900">
            {enabled ? count : 0}
          </span>

          <button
            type="button"
            onClick={onIncrease}
            disabled={!enabled || count >= 5}
            className="h-9 w-9 rounded-xl bg-white text-lg font-bold shadow-sm disabled:cursor-not-allowed disabled:opacity-40"
          >
            +
          </button>
        </div>
      </div>
    </article>
  );
}

function getConnectionLabel(
  connection: PrinterConnection,
) {
  switch (connection) {
    case "usb":
      return "متصلة بواسطة USB";

    case "network":
      return "متصلة بالشبكة";

    case "wifi":
      return "متصلة بواسطة Wi-Fi";

    default:
      return "غير متصلة";
  }
}