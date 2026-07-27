import Link from "next/link";
import { notFound } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

function formatPrice(value: number | null | undefined) {
  return new Intl.NumberFormat("en-US").format(
    Number(value ?? 0)
  );
}

function formatDate(value: string | null | undefined) {
  if (!value) return "غير معروف";

  return new Intl.DateTimeFormat("ar-IQ", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

type OrderPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function OrderDetailsPage({
  params,
}: OrderPageProps) {
  const { id } = await params;

  const supabase = await createClient();

  const { data: order, error } = await supabase
    .from("orders")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !order) {
    notFound();
  }

  const items: unknown[] = Array.isArray(order.items)
    ? order.items
    : [];

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-zinc-950 px-4 py-8 text-white"
    >
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-zinc-400">
              رقم الطلب
            </p>

            <h1 className="text-3xl font-black text-amber-400">
              #{String(order.id).slice(0, 8).toUpperCase()}
            </h1>
          </div>

          <Link
            href="/admin/orders"
            className="rounded-xl bg-white px-4 py-2 font-bold text-black transition hover:bg-zinc-200"
          >
            رجوع للطلبات
          </Link>
        </div>

        <section className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <h2 className="mb-4 text-xl font-black">
              معلومات الزبون
            </h2>

            <div className="space-y-3 text-sm">
              <p>
                <span className="text-zinc-400">
                  الاسم:
                </span>{" "}
                {order.customer_name || "بدون اسم"}
              </p>

              <p>
                <span className="text-zinc-400">
                  الهاتف:
                </span>{" "}
                {order.customer_phone || "غير موجود"}
              </p>

              <p>
                <span className="text-zinc-400">
                  العنوان:
                </span>{" "}
                {order.customer_address || "غير موجود"}
              </p>

              <p>
                <span className="text-zinc-400">
                  الملاحظات:
                </span>{" "}
                {order.order_note || "لا توجد"}
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <h2 className="mb-4 text-xl font-black">
              معلومات الطلب
            </h2>

            <div className="space-y-3 text-sm">
              <p>
                <span className="text-zinc-400">
                  الحالة:
                </span>{" "}
                {order.status || "new"}
              </p>

              <p>
                <span className="text-zinc-400">
                  تاريخ الطلب:
                </span>{" "}
                {formatDate(order.created_at)}
              </p>

              <p>
                <span className="text-zinc-400">
                  المجموع:
                </span>{" "}
                <strong className="text-emerald-400">
                  {formatPrice(order.total)} د.ع
                </strong>
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <h2 className="mb-4 text-xl font-black">
            تفاصيل الأصناف
          </h2>

          {items.length === 0 ? (
            <p className="text-zinc-400">
              لا توجد تفاصيل أصناف محفوظة بهذا الطلب.
            </p>
          ) : (
            <div className="space-y-3">
              {items.map(
                (
                  item: unknown,
                  index: number
                ) => {
                  const safeItem =
                    typeof item === "object" &&
                    item !== null
                      ? (item as Record<string, unknown>)
                      : {};

                  const name = String(
                    safeItem.name ??
                      safeItem.product_name ??
                      safeItem.title ??
                      "صنف"
                  );

                  const quantity = Number(
                    safeItem.quantity ??
                      safeItem.qty ??
                      1
                  );

                  const price = Number(
                    safeItem.price ??
                      safeItem.unit_price ??
                      0
                  );

                  const size =
                    typeof safeItem.size === "string"
                      ? safeItem.size
                      : null;

                  const notes =
                    typeof safeItem.notes === "string"
                      ? safeItem.notes
                      : null;

                  return (
                    <div
                      key={`${name}-${index}`}
                      className="rounded-xl bg-black/20 p-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="font-bold">
                            {name}
                          </p>

                          <p className="text-sm text-zinc-400">
                            الكمية: {quantity}
                          </p>

                          {size && (
                            <p className="text-sm text-zinc-400">
                              الحجم: {size}
                            </p>
                          )}
                        </div>

                        <p className="font-black text-amber-400">
                          {formatPrice(price * quantity)} د.ع
                        </p>
                      </div>

                      {notes && (
                        <p className="mt-3 rounded-lg bg-white/5 p-3 text-sm text-zinc-300">
                          ملاحظات الصنف: {notes}
                        </p>
                      )}
                    </div>
                  );
                }
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}