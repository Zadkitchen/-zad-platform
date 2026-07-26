"use client";

import { motion } from "framer-motion";

export default function AnimatedBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      {/* الإضاءة الذهبية الأولى */}
      <motion.div
        animate={{
          x: [0, 90, -40, 0],
          y: [0, -60, 40, 0],
          scale: [1, 1.25, 0.9, 1],
          opacity: [0.18, 0.3, 0.15, 0.18],
        }}
        transition={{
          duration: 16,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute -right-40 -top-40 h-[520px] w-[520px] rounded-full bg-[#d4af37]/25 blur-[130px]"
      />

      {/* الإضاءة الذهبية الثانية */}
      <motion.div
        animate={{
          x: [0, -100, 50, 0],
          y: [0, 70, -30, 0],
          scale: [1, 0.85, 1.2, 1],
          opacity: [0.12, 0.25, 0.14, 0.12],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute -bottom-48 -left-40 h-[560px] w-[560px] rounded-full bg-[#d4af37]/20 blur-[150px]"
      />

      {/* دائرة ضوئية وسطية */}
      <motion.div
        animate={{
          rotate: [0, 360],
          scale: [1, 1.08, 1],
        }}
        transition={{
          rotate: {
            duration: 30,
            repeat: Infinity,
            ease: "linear",
          },
          scale: {
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          },
        }}
        className="absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#d4af37]/10"
      />

      {/* خطوط زخرفية */}
      <motion.div
        animate={{
          opacity: [0.08, 0.2, 0.08],
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute inset-0 bg-[linear-gradient(rgba(212,175,55,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(212,175,55,0.04)_1px,transparent_1px)] bg-[size:55px_55px]"
      />

      {/* جزيئات ذهبية */}
      <motion.span
        animate={{
          y: [0, -35, 0],
          opacity: [0.2, 0.8, 0.2],
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute right-[15%] top-[30%] h-1.5 w-1.5 rounded-full bg-[#d4af37]"
      />

      <motion.span
        animate={{
          y: [0, 45, 0],
          x: [0, 15, 0],
          opacity: [0.15, 0.7, 0.15],
        }}
        transition={{
          duration: 7,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute left-[20%] top-[20%] h-1 w-1 rounded-full bg-[#efd46b]"
      />

      <motion.span
        animate={{
          y: [0, -50, 0],
          x: [0, -20, 0],
          opacity: [0.1, 0.65, 0.1],
        }}
        transition={{
          duration: 9,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute bottom-[22%] right-[35%] h-1 w-1 rounded-full bg-[#d4af37]"
      />

      {/* تعتيم داخلي */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.25)_55%,rgba(0,0,0,0.85)_100%)]" />
    </div>
  );
}