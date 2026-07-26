"use client";

import { useEffect, useState } from "react";

export default function HomeIntro() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setVisible(false);
    }, 1900);

    return () => window.clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-[#050505]">
      <div className="absolute h-72 w-72 rounded-full bg-[#d4af37]/10 blur-3xl" />

      <div className="relative text-center">
        <div className="animate-[zadIntro_1s_ease_forwards] text-7xl font-black tracking-[0.18em] text-[#d4af37] sm:text-9xl">
          ZAD
        </div>

        <div className="mx-auto mt-5 h-px w-28 animate-[zadLine_.9s_ease_.35s_both] bg-gradient-to-r from-transparent via-[#d4af37] to-transparent" />

        <p className="mt-5 animate-[zadText_.7s_ease_.7s_both] text-lg font-bold text-white sm:text-2xl">
          نكهة تستحق العودة
        </p>
      </div>

      <style>{`
        html {
          scroll-behavior: smooth;
        }

        body {
          background: #080808;
        }

        @keyframes zadIntro {
          from {
            opacity: 0;
            transform: scale(0.84);
            filter: blur(10px);
          }

          to {
            opacity: 1;
            transform: scale(1);
            filter: blur(0);
          }
        }

        @keyframes zadLine {
          from {
            opacity: 0;
            transform: scaleX(0);
          }

          to {
            opacity: 1;
            transform: scaleX(1);
          }
        }

        @keyframes zadText {
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
    </div>
  );
}