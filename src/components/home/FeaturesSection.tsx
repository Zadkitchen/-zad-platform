import {
  BadgeCheck,
  Bike,
  ChefHat,
  UtensilsCrossed,
} from "lucide-react";

const features = [
  {
    icon: ChefHat,
    title: "تحضير بعناية",
    text: "نهتم بطريقة التحضير والتقديم حتى يخرج كل طلب بصورة تليق باسم زاد.",
  },
  {
    icon: BadgeCheck,
    title: "جودة ثابتة",
    text: "مكونات مختارة ومعايير واضحة للحفاظ على المذاق والجودة.",
  },
  {
    icon: Bike,
    title: "توصيل منظم",
    text: "نجهّز ونغلّف الطلب بطريقة تساعد على وصوله بأفضل حالة ممكنة.",
  },
  {
    icon: UtensilsCrossed,
    title: "منيو متنوع",
    text: "وجبات غداء عراقية ووجبات مسائية تناسب مختلف الأذواق.",
  },
];

export default function FeaturesSection() {
  return (
    <section
      id="features"
      className="border-y border-white/10 bg-[#101010]"
    >
      <div className="mx-auto max-w-7xl px-4 py-24 sm:px-8">
        <div className="mb-12 text-center">
          <p className="text-sm font-black tracking-[0.25em] text-[#d4af37]">
            لماذا زاد؟
          </p>

          <h2 className="mt-4 text-4xl font-black sm:text-5xl">
            تفاصيل تصنع الفرق
          </h2>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => {
            const Icon = feature.icon;

            return (
              <article
                key={feature.title}
                className="rounded-[28px] border border-white/10 bg-white/[0.025] p-7 transition duration-300 hover:-translate-y-1 hover:border-[#d4af37]/40"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#d4af37]/10 text-[#d4af37]">
                  <Icon size={27} />
                </div>

                <h3 className="mt-6 text-xl font-black">
                  {feature.title}
                </h3>

                <p className="mt-3 text-sm leading-7 text-white/45">
                  {feature.text}
                </p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}