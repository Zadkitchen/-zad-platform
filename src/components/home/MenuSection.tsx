import { ArrowLeft, MoonStar, Sun } from "lucide-react";

const menus = [
  {
    href: "/lunch",
    title: "منيو الغداء",
    description:
      "تمن ومرق، دجاج عراقي، سمك، روبيان ووجبات عراقية يومية.",
    icon: Sun,
    gradient:
      "bg-[radial-gradient(circle_at_top_right,rgba(212,175,55,0.22),transparent_48%)]",
  },
  {
    href: "/evening",
    title: "منيو المساء",
    description:
      "بيتزا، بركر، ريزو، كرسبي وصاج بخيارات تناسب جميع الأذواق.",
    icon: MoonStar,
    gradient:
      "bg-[radial-gradient(circle_at_top_left,rgba(212,175,55,0.22),transparent_48%)]",
  },
];

export default function MenuSection() {
  return (
    <section id="menus" className="mx-auto max-w-7xl px-4 py-24 sm:px-8">
      <div className="mb-12 text-center">
        <p className="text-sm font-black tracking-[0.25em] text-[#d4af37]">
          اختر وقتك
        </p>

        <h2 className="mt-4 text-4xl font-black sm:text-5xl">
          منيو زاد
        </h2>

        <p className="mx-auto mt-5 max-w-xl leading-8 text-white/50">
          اختر من وجبات الغداء العراقي أو الوجبات المسائية المتنوعة.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {menus.map((menu) => {
          const Icon = menu.icon;

          return (
            <a
              key={menu.href}
              href={menu.href}
              className="group relative min-h-[340px] overflow-hidden rounded-[32px] border border-white/10 bg-[#121212] p-8 transition duration-500 hover:-translate-y-2 hover:border-[#d4af37]/60"
            >
              <div
                className={`absolute inset-0 opacity-70 transition duration-500 group-hover:opacity-100 ${menu.gradient}`}
              />

              <div className="relative flex h-full flex-col justify-between">
                <div>
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-[#d4af37]/25 bg-[#d4af37]/10 text-[#d4af37]">
                    <Icon size={30} />
                  </div>

                  <h3 className="mt-8 text-4xl font-black">
                    {menu.title}
                  </h3>

                  <p className="mt-4 max-w-md leading-8 text-white/50">
                    {menu.description}
                  </p>
                </div>

                <div className="mt-10 flex items-center justify-between">
                  <span className="font-black text-[#d4af37]">
                    استعرض الوجبات
                  </span>

                  <span className="flex h-12 w-12 items-center justify-center rounded-full border border-[#d4af37]/40 text-[#d4af37] transition group-hover:bg-[#d4af37] group-hover:text-black">
                    <ArrowLeft size={22} />
                  </span>
                </div>
              </div>
            </a>
          );
        })}
      </div>
    </section>
  );
}