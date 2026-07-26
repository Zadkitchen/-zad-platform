"use client";

import { useEffect, useState } from "react";

export default function HomePage() {
  const [showIntro, setShowIntro] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowIntro(false);
    }, 2200);

    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      {showIntro && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-[#050505]">
          <div className="absolute h-72 w-72 rounded-full bg-[#c9a227]/10 blur-3xl" />

          <div className="relative text-center">
            <div className="intro-logo text-7xl font-black tracking-[0.18em] text-[#c9a227] sm:text-9xl">
              ZAD
            </div>

            <div className="intro-line mx-auto mt-5 h-px w-28 bg-gradient-to-r from-transparent via-[#c9a227] to-transparent" />

            <p className="intro-text mt-5 text-lg font-bold tracking-wide text-white sm:text-2xl">
              نكهة تستحق العودة
            </p>
          </div>
        </div>
      )}

      <main
        dir="rtl"
        className="min-h-screen overflow-hidden bg-[#090909] text-[#f8f8f8]"
      >
        <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[#090909]/80 backdrop-blur-xl">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
            <a href="/" className="group">
              <div className="text-3xl font-black tracking-[0.12em] text-[#c9a227]">
                ZAD
              </div>
              <div className="text-[10px] tracking-[0.28em] text-white/50">
                KITCHEN
              </div>
            </a>

            <nav className="hidden items-center gap-8 text-sm font-bold md:flex">
              <a
                href="/"
                className="text-[#c9a227] transition hover:text-[#f4d03f]"
              >
                الرئيسية
              </a>

              <a
                href="/lunch"
                className="text-white/70 transition hover:text-[#c9a227]"
              >
                منيو الغداء
              </a>

              <a
                href="/evening"
                className="text-white/70 transition hover:text-[#c9a227]"
              >
                منيو المساء
              </a>

              <a
                href="#contact"
                className="text-white/70 transition hover:text-[#c9a227]"
              >
                تواصل معنا
              </a>
            </nav>

            <button className="rounded-full border border-[#c9a227]/60 px-4 py-2 text-sm font-black text-[#c9a227] transition hover:bg-[#c9a227] hover:text-black">
              السلة (0)
            </button>
          </div>
        </header>

        <section className="relative flex min-h-screen items-center justify-center px-5 pt-24">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(201,162,39,0.13),transparent_38%)]" />

          <div className="absolute left-[-120px] top-40 h-72 w-72 rounded-full border border-[#c9a227]/10" />
          <div className="absolute right-[-160px] bottom-20 h-96 w-96 rounded-full border border-[#c9a227]/10" />

          <div className="relative z-10 mx-auto max-w-4xl text-center">
            <div className="mx-auto mb-8 inline-flex items-center gap-3 rounded-full border border-[#c9a227]/25 bg-[#c9a227]/5 px-5 py-2 text-sm font-bold text-[#c9a227] backdrop-blur">
              <span className="h-2 w-2 rounded-full bg-[#c9a227]" />
              مطبخ زاد — البصرة
            </div>

            <h1 className="text-6xl font-black leading-none tracking-[0.08em] text-[#c9a227] sm:text-8xl md:text-9xl">
              ZAD
            </h1>

            <p className="mt-6 text-3xl font-black sm:text-5xl">
              نكهة تستحق العودة
            </p>

            <p className="mx-auto mt-7 max-w-2xl text-base leading-8 text-white/55 sm:text-lg">
              من الغداء العراقي الأصيل إلى البيتزا والبركر والوجبات المسائية،
              نحضّر كل طلب بعناية حتى يصلك بطعم يليق باسم زاد.
            </p>

            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <a
                href="#menus"
                className="w-full rounded-full bg-[#c9a227] px-9 py-4 text-base font-black text-black shadow-[0_0_40px_rgba(201,162,39,0.15)] transition hover:-translate-y-1 hover:bg-[#f4d03f] sm:w-auto"
              >
                استعرض المنيو
              </a>

              <a
                href="#contact"
                className="w-full rounded-full border border-white/15 bg-white/[0.03] px-9 py-4 text-base font-black text-white transition hover:border-[#c9a227]/60 hover:text-[#c9a227] sm:w-auto"
              >
                تواصل معنا
              </a>
            </div>

            <a
              href="#menus"
              className="mt-16 inline-flex flex-col items-center gap-3 text-xs font-bold tracking-widest text-white/35 transition hover:text-[#c9a227]"
            >
              اكتشف زاد
              <span className="animate-bounce text-xl">↓</span>
            </a>
          </div>
        </section>

        <section id="menus" className="mx-auto max-w-7xl px-5 py-24 sm:px-8">
          <div className="mb-12 text-center">
            <p className="text-sm font-black tracking-widest text-[#c9a227]">
              اختر وقتك
            </p>

            <h2 className="mt-4 text-4xl font-black sm:text-5xl">
              منيو زاد
            </h2>

            <p className="mx-auto mt-5 max-w-xl leading-8 text-white/50">
              اختر من وجبات الغداء العراقي أو وجبات المساء المتنوعة.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <a
              href="/lunch"
              className="group relative min-h-[320px] overflow-hidden rounded-[32px] border border-white/10 bg-[#141414] p-8 transition duration-500 hover:-translate-y-2 hover:border-[#c9a227]/60"
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(201,162,39,0.18),transparent_45%)] opacity-60 transition group-hover:opacity-100" />

              <div className="relative flex h-full flex-col justify-between">
                <div>
                  <span className="text-5xl">🍛</span>

                  <h3 className="mt-8 text-4xl font-black text-white">
                    منيو الغداء
                  </h3>

                  <p className="mt-4 max-w-md leading-8 text-white/50">
                    تمن ومرق، دجاج عراقي، سمك، روبيان ووجبات عراقية بطعم زاد.
                  </p>
                </div>

                <div className="mt-10 flex items-center justify-between">
                  <span className="font-black text-[#c9a227]">
                    استعرض الوجبات
                  </span>

                  <span className="flex h-12 w-12 items-center justify-center rounded-full border border-[#c9a227]/40 text-2xl text-[#c9a227] transition group-hover:bg-[#c9a227] group-hover:text-black">
                    ←
                  </span>
                </div>
              </div>
            </a>

            <a
              href="/evening"
              className="group relative min-h-[320px] overflow-hidden rounded-[32px] border border-white/10 bg-[#141414] p-8 transition duration-500 hover:-translate-y-2 hover:border-[#c9a227]/60"
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(201,162,39,0.18),transparent_45%)] opacity-60 transition group-hover:opacity-100" />

              <div className="relative flex h-full flex-col justify-between">
                <div>
                  <span className="text-5xl">🍕</span>

                  <h3 className="mt-8 text-4xl font-black text-white">
                    منيو المساء
                  </h3>

                  <p className="mt-4 max-w-md leading-8 text-white/50">
                    بيتزا، بركر، ريزو، كرسبي وصاج بوجبات تناسب كل الأذواق.
                  </p>
                </div>

                <div className="mt-10 flex items-center justify-between">
                  <span className="font-black text-[#c9a227]">
                    استعرض الوجبات
                  </span>

                  <span className="flex h-12 w-12 items-center justify-center rounded-full border border-[#c9a227]/40 text-2xl text-[#c9a227] transition group-hover:bg-[#c9a227] group-hover:text-black">
                    ←
                  </span>
                </div>
              </div>
            </a>
          </div>
        </section>

        <section className="border-y border-white/10 bg-[#111111]">
          <div className="mx-auto max-w-7xl px-5 py-24 sm:px-8">
            <div className="mb-12 text-center">
              <p className="text-sm font-black tracking-widest text-[#c9a227]">
                لماذا زاد؟
              </p>

              <h2 className="mt-4 text-4xl font-black sm:text-5xl">
                تفاصيل تصنع الفرق
              </h2>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  icon: "🇮🇶",
                  title: "دجاج عراقي",
                  text: "جميع وجبات الدجاج من دجاج عراقي مذبوح على الطريقة الشرعية.",
                },
                {
                  icon: "✨",
                  title: "جودة ثابتة",
                  text: "نهتم بالمذاق والجودة في كل طلب يخرج من مطبخ زاد.",
                },
                {
                  icon: "🚚",
                  title: "توصيل سريع",
                  text: "نجهّز الطلب بعناية ليصلك بأفضل حالة ممكنة.",
                },
                {
                  icon: "🍽️",
                  title: "تنوع بالمنيو",
                  text: "غداء عراقي ووجبات مسائية تناسب مختلف الأذواق.",
                },
              ].map((feature) => (
                <article
                  key={feature.title}
                  className="rounded-[28px] border border-white/10 bg-white/[0.025] p-7 transition hover:border-[#c9a227]/40"
                >
                  <span className="text-4xl">{feature.icon}</span>

                  <h3 className="mt-6 text-xl font-black">
                    {feature.title}
                  </h3>

                  <p className="mt-3 text-sm leading-7 text-white/45">
                    {feature.text}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section
          id="contact"
          className="mx-auto max-w-5xl px-5 py-24 text-center sm:px-8"
        >
          <p className="text-sm font-black tracking-widest text-[#c9a227]">
            تواصل معنا
          </p>

          <h2 className="mt-4 text-4xl font-black sm:text-5xl">
            طلبك أقرب مما تتوقع
          </h2>

          <p className="mx-auto mt-5 max-w-xl leading-8 text-white/50">
            قريبًا سنربط الطلب مباشرة بواتساب ونضيف جميع وسائل التواصل
            الرسمية لمطبخ زاد.
          </p>

          <button className="mt-9 rounded-full bg-[#c9a227] px-10 py-4 font-black text-black transition hover:-translate-y-1 hover:bg-[#f4d03f]">
            اطلب عبر واتساب
          </button>
        </section>

        <footer className="border-t border-white/10 px-5 py-10 text-center">
          <div className="text-3xl font-black tracking-[0.12em] text-[#c9a227]">
            ZAD
          </div>

          <p className="mt-3 font-bold text-white/70">
            نكهة تستحق العودة
          </p>

          <p className="mt-5 text-sm text-white/30">
            © 2026 مطبخ زاد — جميع الحقوق محفوظة
          </p>
        </footer>
      </main>

      <style jsx global>{`
        html {
          scroll-behavior: smooth;
        }

        body {
          background: #090909;
        }

        .intro-logo {
          animation: introLogo 1.1s ease forwards;
        }

        .intro-line {
          animation: introLine 1s ease 0.45s both;
        }

        .intro-text {
          animation: introText 0.8s ease 0.85s both;
        }

        @keyframes introLogo {
          from {
            opacity: 0;
            transform: scale(0.85);
            filter: blur(10px);
          }

          to {
            opacity: 1;
            transform: scale(1);
            filter: blur(0);
          }
        }

        @keyframes introLine {
          from {
            opacity: 0;
            transform: scaleX(0);
          }

          to {
            opacity: 1;
            transform: scaleX(1);
          }
        }

        @keyframes introText {
          from {
            opacity: 0;
            transform: translateY(12px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </>
  );
}