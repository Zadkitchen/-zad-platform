"use client";

import { ArrowLeft, ChevronDown, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";

import AnimatedBackground from "./AnimatedBackground";

export default function HeroSection() {
  function scrollToMenu() {
    document
      .getElementById("menu-section")
      ?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <section
      dir="rtl"
      className="relative flex min-h-[92svh] items-center overflow-hidden bg-[#070707] px-4 py-24 text-white"
    >
      <AnimatedBackground />

      <div className="relative z-10 mx-auto w-full max-w-7xl">
        <div className="mx-auto max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 25, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{
              duration: 0.8,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="inline-flex items-center gap-2 rounded-full border border-[#d4af37]/30 bg-[#d4af37]/10 px-5 py-2 text-sm font-black text-[#efd46b] backdrop-blur-xl"
          >
            <Sparkles size={16} />
            تجربة جديدة من قلب البصرة
          </motion.div>

          <motion.p
            initial={{ opacity: 0, letterSpacing: "0.1em" }}
            animate={{ opacity: 1, letterSpacing: "0.4em" }}
            transition={{ delay: 0.15, duration: 1 }}
            className="mt-8 text-sm font-black text-[#d4af37]"
          >
            ZAD KITCHEN
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 45 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: 0.25,
              duration: 0.9,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="mt-5 text-5xl font-black leading-[1.15] sm:text-6xl lg:text-8xl"
          >
            مو مجرد وجبة
            <span className="mt-2 block bg-gradient-to-l from-[#fff1a8] via-[#d4af37] to-[#8c6b14] bg-clip-text text-transparent">
              هذه تجربة زاد
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: 0.45,
              duration: 0.8,
            }}
            className="mx-auto mt-7 max-w-2xl text-base leading-8 text-white/55 sm:text-lg"
          >
            نكهة عراقية، تفاصيل محسوبة، وجودة تستحق أن ترجع إلها
            مرة بعد مرة.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 35 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: 0.6,
              duration: 0.8,
            }}
            className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
          >
            <motion.div
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              className="w-full sm:w-auto"
            >
              <Link
                href="/lunch"
                className="group flex w-full items-center justify-center gap-3 rounded-2xl bg-[#d4af37] px-8 py-4 font-black text-black shadow-[0_15px_45px_rgba(212,175,55,0.25)] transition hover:bg-[#efd46b] sm:w-auto"
              >
                اطلب وجبة الغداء
                <ArrowLeft
                  size={19}
                  className="transition group-hover:-translate-x-1"
                />
              </Link>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              className="w-full sm:w-auto"
            >
              <Link
                href="/evening"
                className="flex w-full items-center justify-center rounded-2xl border border-white/15 bg-white/[0.05] px-8 py-4 font-black text-white backdrop-blur-xl transition hover:border-[#d4af37]/50 hover:bg-[#d4af37]/10 hover:text-[#efd46b] sm:w-auto"
              >
                تصفح المنيو المسائي
              </Link>
            </motion.div>
          </motion.div>
        </div>

        {/* بطاقات صغيرة متحركة */}
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: 0.8,
            duration: 1,
          }}
          className="mx-auto mt-16 grid max-w-4xl gap-3 sm:grid-cols-3"
        >
          {[
            {
              title: "جودة مختارة",
              description: "مكونات نهتم بكل تفصيل بيها",
            },
            {
              title: "تحضير بعناية",
              description: "كل طلب يتحضر وقت الطلب",
            },
            {
              title: "نكهة تستحق العودة",
              description: "تجربة نخليها تبقى ببالك",
            },
          ].map((item, index) => (
            <motion.div
              key={item.title}
              animate={{
                y: index === 1 ? [0, -7, 0] : [0, 7, 0],
              }}
              transition={{
                duration: 4 + index,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="rounded-3xl border border-white/10 bg-white/[0.035] p-5 text-center backdrop-blur-xl"
            >
              <p className="font-black text-[#d4af37]">
                {item.title}
              </p>

              <p className="mt-2 text-sm leading-6 text-white/45">
                {item.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>

      <motion.button
        type="button"
        onClick={scrollToMenu}
        aria-label="الانتقال إلى المنيو"
        animate={{ y: [0, 9, 0] }}
        transition={{
          duration: 1.8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute bottom-6 left-1/2 z-20 flex -translate-x-1/2 flex-col items-center gap-2 text-white/40 transition hover:text-[#d4af37]"
      >
        <span className="text-xs font-bold">اكتشف أكثر</span>
        <ChevronDown size={22} />
      </motion.button>
    </section>
  );
}