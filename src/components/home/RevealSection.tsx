"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

type RevealSectionProps = {
  children: ReactNode;
  className?: string;
  direction?: "up" | "right" | "left";
};

export default function RevealSection({
  children,
  className = "",
  direction = "up",
}: RevealSectionProps) {
  const hiddenPosition = {
    up: { y: 60, x: 0 },
    right: { y: 0, x: 70 },
    left: { y: 0, x: -70 },
  };

  return (
    <motion.div
      initial={{
        opacity: 0,
        ...hiddenPosition[direction],
      }}
      whileInView={{
        opacity: 1,
        x: 0,
        y: 0,
      }}
      viewport={{
        once: true,
        amount: 0.15,
      }}
      transition={{
        duration: 0.8,
        ease: [0.22, 1, 0.36, 1],
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}