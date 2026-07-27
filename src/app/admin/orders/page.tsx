import { createClient } from "@/lib/supabase/server";

function formatPrice(price: number) {
  return new Intl.NumberFormat("ar-IQ").format(price);
}

function formatDate(date: string) {
  return new Date(date).toLocaleString("ar-IQ");
}

const statusMap: Record<
  string,
  {
    label: string;
    color: string;
  }
> = {
  new: {
    label: "🟠 جديد",
    color: "bg-orange-500/20 text-orange-300",
  },
  confirmed: {
    label: "🟡 تم التأكيد",
    color: "bg-yellow-500/20 text-yellow-300",
  },
  preparing: {
    label: "🔵 قيد التحضير",
    color: "bg-sky-500/20 text-sky-300",
  },
  ready: {
    label: "🟣 جاهز",
    color: "bg-purple-500/20 text-purple-300",
  },
  out_for_delivery: {
    label: "🚚 خرج للتوصيل",
    color: "bg-cyan-500/20 text-cyan-300",
  },
  delivered: {
    label: "✅ تم التسليم",
    color: "bg-green-500/20 text-green-300",
  },
  cancelled: {
    label: "❌ ملغي",
    color: "bg-red-500/20 text-red-300",
  },
};

export default async function OrdersPage() {
  const supabase = await createClient();

  const { data: orders } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", {
      ascending: false,
    });

  return (
    <main className="space-y-6">

      <div>
        <h1 className="text-3xl font-black">
          إدارة الطلبات
        </h1>

        <p className="text-neutral-400 mt-2">
          جميع الطلبات الواردة من الموقع.
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#111]">

        <table className="w-full text-right">

          <thead className="bg-black/30">

            <tr>

              <th className="p-4">رقم الطلب</th>

              <th className="p-4">الزبون</th>

              <th className="p-4">الهاتف</th>

              <th className="p-4">الإجمالي</th>

              <th className="p-4">الحالة</th>

              <th className="p-4">التاريخ</th>

            </tr>

          </thead>

          <tbody>

            {orders?.map((order) => {

              const status =
                statusMap[order.status] ??
                statusMap.new;

              return (

                <tr
                  key={order.id}
                  className="border-t border-white/10"
                >

                  <td className="p-4 font-mono">
                    #
                    {order.id
                      .replaceAll("-", "")
                      .slice(0, 8)
                      .toUpperCase()}
                  </td>

                  <td className="p-4">
                    {order.customer_name}
                  </td>

                  <td className="p-4">
                    {order.customer_phone}
                  </td>

                  <td className="p-4">
                    {formatPrice(order.total)} د.ع
                  </td>

                  <td className="p-4">

                    <span
                      className={`rounded-full px-3 py-1 text-sm font-bold ${status.color}`}
                    >
                      {status.label}
                    </span>

                  </td>

                  <td className="p-4 text-sm text-neutral-400">
                    {formatDate(order.created_at)}
                  </td>

                </tr>

              );

            })}

          </tbody>

        </table>

      </div>

    </main>
  );
}