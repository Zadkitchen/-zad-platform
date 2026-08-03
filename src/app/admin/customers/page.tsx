import {
  ArrowRight,
  BadgeCheck,
  Gift,
  Search,
  ShoppingBag,
  Sparkles,
  Trophy,
  UserRound,
  Users,
  WalletCards,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { createClient } from "../../../lib/supabase/server";

export const dynamic = "force-dynamic";

type CustomerSummary = {
  phone: string;
  customer_name: string | null;
  last_order_at: string | null;

  total_orders: number;
  delivered_orders: number;
  total_spent: number;
  active_orders: number;

  loyalty_enabled: boolean;
  required_orders: number;
  discount_type: "percentage" | "fixed";
  discount_value: number;

  loyalty_progress: number;
  remaining_orders: number;
  reward_ready: boolean;
};

type LoyaltyStatistics = {
  total_customers: number;
  active_customers: number;
  rewards_ready: number;
  customers_one_order_away: number;
  total_delivered_orders: number;
  total_customer_spending: number;
};

type CustomersPageProps = {
  searchParams: Promise<{
    search?: string;
    sort?: string;
  }>;
};

function formatPrice(value: number) {
  return new Intl.NumberFormat("ar-US").format(
    Number(value) || 0
  );
}

function formatDate(value: string | null) {
  if (!value) {
    return "لا يوجد";
  }

  return new Intl.DateTimeFormat("ar-IQ", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function getRewardText(customer: CustomerSummary) {
  if (!customer.loyalty_enabled) {
    return "برنامج الولاء متوقف";
  }

  if (customer.reward_ready) {
    return "المكافأة جاهزة";
  }

  if (customer.remaining_orders === 1) {
    return "باقي طلب واحد";
  }

  return `باقي ${customer.remaining_orders} طلبات`;
}

function getDiscountLabel(customer: CustomerSummary) {
  if (customer.discount_type === "fixed") {
    return `${formatPrice(
      customer.discount_value
    )} د.ع`;
  }

  return `${customer.discount_value}%`;
}

export default async function CustomersPage({
  searchParams,
}: CustomersPageProps) {
  const params = await searchParams;

  const search = String(
    params.search ?? ""
  ).trim();

  const sort = String(
    params.sort ?? "spent"
  );

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

  const {
    data: statisticsData,
    error: statisticsError,
  } = await supabase
    .from("loyalty_live_statistics")
    .select("*")
    .maybeSingle();

  let customersQuery = supabase
    .from("customer_loyalty_summary")
    .select("*");

  if (search) {
    customersQuery = customersQuery.or(
      `customer_name.ilike.%${search}%,phone.ilike.%${search}%`
    );
  }

  switch (sort) {
    case "orders":
      customersQuery = customersQuery.order(
        "delivered_orders",
        {
          ascending: false,
        }
      );
      break;

    case "progress":
      customersQuery = customersQuery.order(
        "loyalty_progress",
        {
          ascending: false,
        }
      );
      break;

    case "recent":
      customersQuery = customersQuery.order(
        "last_order_at",
        {
          ascending: false,
          nullsFirst: false,
        }
      );
      break;

    case "spent":
    default:
      customersQuery = customersQuery.order(
        "total_spent",
        {
          ascending: false,
        }
      );
      break;
  }

  const {
    data: customersData,
    error: customersError,
  } = await customersQuery.limit(500);

  const statistics: LoyaltyStatistics = {
    total_customers: Number(
      statisticsData?.total_customers ?? 0
    ),

    active_customers: Number(
      statisticsData?.active_customers ?? 0
    ),

    rewards_ready: Number(
      statisticsData?.rewards_ready ?? 0
    ),

    customers_one_order_away: Number(
      statisticsData?.customers_one_order_away ??
        0
    ),

    total_delivered_orders: Number(
      statisticsData?.total_delivered_orders ??
        0
    ),

    total_customer_spending: Number(
      statisticsData?.total_customer_spending ??
        0
    ),
  };

  const customers =
    (customersData ?? []) as CustomerSummary[];

  const statisticsCards = [
    {
      title: "إجمالي العملاء",
      value: statistics.total_customers,
      icon: Users,
    },
    {
      title: "عملاء لديهم طلبات مكتملة",
      value: statistics.active_customers,
      icon: BadgeCheck,
    },
    {
      title: "مكافآت جاهزة",
      value: statistics.rewards_ready,
      icon: Gift,
    },
    {
      title: "باقي لهم طلب واحد",
      value:
        statistics.customers_one_order_away,
      icon: Sparkles,
    },
  ];

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-[#070707] px-4 py-6 text-white sm:px-6"
    >
      <div className="mx-auto max-w-7xl">
        <header className="rounded-3xl border border-white/10 bg-[#111] p-5 sm:p-6">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-sm font-bold text-white/45 transition hover:text-[#d4af37]"
          >
            <ArrowRight size={17} />
            الرجوع إلى لوحة الإدارة
          </Link>

          <div className="mt-5 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-black tracking-[0.3em] text-[#d4af37]">
                ZAD CUSTOMERS
              </p>

              <h1 className="mt-2 text-3xl font-black sm:text-4xl">
                إدارة العملاء والولاء
              </h1>

              <p className="mt-2 text-white/45">
                متابعة العملاء، الطلبات، الإنفاق،
                وتقدم مكافآت الولاء.
              </p>
            </div>

            <div className="rounded-2xl border border-[#d4af37]/20 bg-[#d4af37]/10 px-5 py-4">
              <p className="text-xs font-bold text-white/45">
                إجمالي مبيعات العملاء المكتملة
              </p>

              <p className="mt-2 text-2xl font-black text-[#d4af37]">
                {formatPrice(
                  statistics.total_customer_spending
                )}{" "}
                د.ع
              </p>
            </div>
          </div>
        </header>

        <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {statisticsCards.map((item) => {
            const Icon = item.icon;

            return (
              <article
                key={item.title}
                className="rounded-3xl border border-white/10 bg-[#111] p-5"
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-bold text-white/45">
                      {item.title}
                    </p>

                    <p className="mt-3 text-4xl font-black text-[#d4af37]">
                      {item.value}
                    </p>
                  </div>

                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#d4af37]/10 text-[#d4af37]">
                    <Icon size={25} />
                  </div>
                </div>
              </article>
            );
          })}
        </section>

        <section className="mt-6 rounded-3xl border border-white/10 bg-[#111] p-4 sm:p-5">
          <form className="grid gap-4 lg:grid-cols-[1fr_240px_auto]">
            <div className="relative">
              <Search
                size={18}
                className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#d4af37]"
              />

              <input
                name="search"
                defaultValue={search}
                placeholder="ابحث بالاسم أو رقم الهاتف..."
                className="h-14 w-full rounded-2xl border border-white/10 bg-white/[0.04] pr-12 pl-4 outline-none transition placeholder:text-white/25 focus:border-[#d4af37]/50"
              />
            </div>

            <select
              name="sort"
              defaultValue={sort}
              className="h-14 rounded-2xl border border-white/10 bg-[#171717] px-4 font-bold outline-none focus:border-[#d4af37]/50"
            >
              <option value="spent">
                الأعلى إنفاقًا
              </option>

              <option value="orders">
                الأكثر طلبًا
              </option>

              <option value="progress">
                الأعلى تقدمًا بالولاء
              </option>

              <option value="recent">
                آخر طلب
              </option>
            </select>

            <button
              type="submit"
              className="h-14 rounded-2xl bg-[#d4af37] px-7 font-black text-black transition hover:bg-[#efd46b]"
            >
              بحث وترتيب
            </button>
          </form>
        </section>

        {(statisticsError || customersError) && (
          <div className="mt-6 rounded-3xl border border-red-500/20 bg-red-500/10 p-5 text-red-300">
            تعذر تحميل بيانات العملاء:
            {" "}
            {statisticsError?.message ||
              customersError?.message}
          </div>
        )}

        {!customersError &&
          customers.length === 0 && (
            <section className="mt-6 flex min-h-[320px] flex-col items-center justify-center rounded-3xl border border-dashed border-white/10 bg-[#111] px-5 text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-[#d4af37]/10 text-[#d4af37]">
                <UserRound size={36} />
              </div>

              <h2 className="mt-5 text-2xl font-black">
                لا يوجد عملاء
              </h2>

              <p className="mt-3 text-white/45">
                سيظهر العملاء هنا بعد تسجيل
                الطلبات بأرقام هواتفهم.
              </p>
            </section>
          )}

        {!customersError &&
          customers.length > 0 && (
            <section className="mt-6 grid gap-4 xl:grid-cols-2">
              {customers.map((customer) => {
                const progressPercentage =
                  customer.required_orders > 0
                    ? Math.min(
                        100,
                        Math.round(
                          (customer.loyalty_progress /
                            customer.required_orders) *
                            100
                        )
                      )
                    : 0;

                return (
                  <article
                    key={customer.phone}
                    className={`rounded-3xl border bg-[#111] p-5 ${
                      customer.reward_ready
                        ? "border-[#d4af37]/50 shadow-[0_18px_55px_rgba(212,175,55,0.08)]"
                        : "border-white/10"
                    }`}
                  >
                    <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex items-start gap-4">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#d4af37]/10 text-[#d4af37]">
                          <UserRound size={25} />
                        </div>

                        <div>
                          <h2 className="text-xl font-black">
                            {customer.customer_name ||
                              "زبون زاد"}
                          </h2>

                          <p
                            dir="ltr"
                            className="mt-2 text-right font-bold text-white/45"
                          >
                            {customer.phone}
                          </p>

                          <p className="mt-2 text-xs text-white/30">
                            آخر طلب:{" "}
                            {formatDate(
                              customer.last_order_at
                            )}
                          </p>
                        </div>
                      </div>

                      <span
                        className={`w-fit rounded-full px-4 py-2 text-xs font-black ${
                          customer.reward_ready
                            ? "bg-[#d4af37] text-black"
                            : customer.remaining_orders ===
                                1
                              ? "bg-blue-500/10 text-blue-300"
                              : "bg-white/[0.05] text-white/50"
                        }`}
                      >
                        {customer.reward_ready
                          ? "🎁 المكافأة جاهزة"
                          : getRewardText(customer)}
                      </span>
                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                      <div className="rounded-2xl bg-white/[0.04] p-3">
                        <ShoppingBag
                          size={17}
                          className="text-[#d4af37]"
                        />

                        <p className="mt-2 text-xs text-white/35">
                          كل الطلبات
                        </p>

                        <p className="mt-1 text-xl font-black">
                          {customer.total_orders}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-white/[0.04] p-3">
                        <BadgeCheck
                          size={17}
                          className="text-green-300"
                        />

                        <p className="mt-2 text-xs text-white/35">
                          المكتملة
                        </p>

                        <p className="mt-1 text-xl font-black">
                          {customer.delivered_orders}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-white/[0.04] p-3">
                        <WalletCards
                          size={17}
                          className="text-[#d4af37]"
                        />

                        <p className="mt-2 text-xs text-white/35">
                          إجمالي المصروف
                        </p>

                        <p className="mt-1 text-sm font-black">
                          {formatPrice(
                            customer.total_spent
                          )}{" "}
                          د.ع
                        </p>
                      </div>

                      <div className="rounded-2xl bg-white/[0.04] p-3">
                        <Trophy
                          size={17}
                          className="text-[#d4af37]"
                        />

                        <p className="mt-2 text-xs text-white/35">
                          مكافأة الولاء
                        </p>

                        <p className="mt-1 text-sm font-black">
                          {getDiscountLabel(
                            customer
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4">
                      <div className="flex items-center justify-between gap-4">
                        <p className="font-black">
                          تقدم الولاء
                        </p>

                        <p className="font-black text-[#d4af37]">
                          {customer.loyalty_progress}
                          {" / "}
                          {customer.required_orders}
                        </p>
                      </div>

                      <div className="mt-3 h-3 overflow-hidden rounded-full bg-white/10">
                        <div
                          style={{
                            width: `${progressPercentage}%`,
                          }}
                          className="h-full rounded-full bg-[#d4af37] transition-all"
                        />
                      </div>

                      <p className="mt-3 text-sm text-white/45">
                        {customer.reward_ready
                          ? "هذا الزبون يستحق خصم الولاء في طلبه القادم."
                          : getRewardText(customer)}
                      </p>
                    </div>
                  </article>
                );
              })}
            </section>
          )}
      </div>
    </main>
  );
}