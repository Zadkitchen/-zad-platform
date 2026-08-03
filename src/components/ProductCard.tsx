"use client";

import {
  Eye,
  Flame,
  Heart,
  Plus,
  Star,
} from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";

import { useCart } from "../context/cart-context";
import type { MenuProduct } from "../types/menu";

type ProductCardProps = {
  product: MenuProduct;
};

function formatPrice(price: number) {
  return new Intl.NumberFormat("ar-US").format(
    Math.round(price)
  );
}

export default function ProductCard({
  product,
}: ProductCardProps) {
  const { addItem } = useCart();

  const [isFavourite, setIsFavourite] =
    useState(false);

  const isAvailable =
    product.available !== false;

  const offerActive =
    product.offerActive === true &&
    Number(product.originalPrice ?? 0) >
      Number(product.price);

  const originalPrice = Number(
    product.originalPrice ?? product.price
  );

  const finalPrice = Number(product.price);

  const discountPercentage = Math.max(
    0,
    Number(product.discountPercentage ?? 0)
  );

  return (
    <motion.article
      initial={{ opacity: 0, y: 35 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      whileHover={{
        y: -8,
        scale: 1.02,
      }}
      transition={{
        duration: 0.45,
        ease: [0.22, 1, 0.36, 1],
      }}
      className="group overflow-hidden rounded-3xl border border-white/10 bg-[#111] transition duration-300 hover:border-[#d4af37]/40 hover:shadow-[0_20px_60px_rgba(212,175,55,0.12)]"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-white/[0.04]">
        {product.image ? (
          <motion.img
            src={product.image}
            alt={product.name}
            whileHover={{ scale: 1.08 }}
            transition={{ duration: 0.5 }}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <motion.div
              animate={{
                y: [0, -8, 0],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
              }}
              className="text-center"
            >
              <p className="text-5xl">🍽️</p>

              <p className="mt-3 text-sm font-bold text-white/35">
                صورة الوجبة قريبًا
              </p>
            </motion.div>
          </div>
        )}

        <div className="absolute inset-x-0 top-0 flex items-start justify-between p-3">
          <div className="flex flex-wrap gap-2">
            {offerActive && (
              <motion.span
                animate={{
                  scale: [1, 1.05, 1],
                }}
                transition={{
                  duration: 1.8,
                  repeat: Infinity,
                }}
                className="flex items-center gap-1 rounded-full bg-red-600 px-3 py-1 text-xs font-black text-white shadow-lg"
              >
                <Flame
                  size={13}
                  fill="currentColor"
                />

                {product.offerName?.trim() ||
                  "عرض خاص"}

                {discountPercentage > 0 && (
                  <span>
                    -{discountPercentage}%
                  </span>
                )}
              </motion.span>
            )}

            {product.featured && (
              <motion.span
                animate={{
                  scale: [1, 1.05, 1],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                }}
                className="flex items-center gap-1 rounded-full bg-[#d4af37] px-3 py-1 text-xs font-black text-black"
              >
                <Star
                  size={13}
                  fill="currentColor"
                />
                الأكثر طلبًا
              </motion.span>
            )}

            {!isAvailable && (
              <span className="rounded-full bg-red-600 px-3 py-1 text-xs font-black text-white">
                غير متوفر
              </span>
            )}
          </div>

          <motion.button
            whileTap={{ scale: 0.85 }}
            whileHover={{ scale: 1.15 }}
            type="button"
            onClick={() =>
              setIsFavourite(!isFavourite)
            }
            aria-label={
              isFavourite
                ? "إزالة من المفضلة"
                : "إضافة إلى المفضلة"
            }
            className={`flex h-10 w-10 items-center justify-center rounded-full backdrop-blur-md transition ${
              isFavourite
                ? "bg-red-500 text-white"
                : "bg-black/50 text-white"
            }`}
          >
            <Heart
              size={18}
              fill={
                isFavourite
                  ? "currentColor"
                  : "none"
              }
            />
          </motion.button>
        </div>
      </div>

      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            {product.category && (
              <p className="text-xs font-black text-[#d4af37]">
                {product.category}
              </p>
            )}

            <h3 className="mt-2 text-xl font-black text-white">
              {product.name}
            </h3>

            {product.size && (
              <p className="mt-2 text-sm text-white/45">
                الحجم: {product.size}
              </p>
            )}

            {product.description && (
              <p className="mt-3 line-clamp-2 leading-6 text-white/50">
                {product.description}
              </p>
            )}
          </div>

          <motion.div
            animate={{
              y: [0, -3, 0],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
            }}
            className="shrink-0 text-left"
          >
            {offerActive && (
              <p className="text-sm font-bold text-white/35 line-through decoration-red-500 decoration-2">
                {formatPrice(originalPrice)} د.ع
              </p>
            )}

            <p className="mt-1 text-xl font-black text-[#d4af37]">
              {formatPrice(finalPrice)}
            </p>

            <p className="text-xs text-white/40">
              د.ع
            </p>

            {offerActive &&
              Number(
                product.discountAmount ?? 0
              ) > 0 && (
                <p className="mt-2 text-xs font-bold text-emerald-300">
                  وفّرت{" "}
                  {formatPrice(
                    Number(
                      product.discountAmount
                    )
                  )}{" "}
                  د.ع
                </p>
              )}
          </motion.div>
        </div>

        <div className="mt-5 grid grid-cols-[1fr_auto] gap-3">
          <motion.button
            whileHover={{
              scale: 1.03,
            }}
            whileTap={{
              scale: 0.97,
            }}
            type="button"
            onClick={() => addItem(product)}
            disabled={!isAvailable}
            className="flex items-center justify-center gap-2 rounded-2xl bg-[#d4af37] px-4 py-3 font-black text-black transition hover:bg-[#efd46b] disabled:bg-neutral-700 disabled:text-neutral-400"
          >
            <Plus size={18} />

            {isAvailable
              ? "أضف للسلة"
              : "غير متوفر"}
          </motion.button>

          <motion.button
            whileHover={{
              rotate: 15,
              scale: 1.08,
            }}
            whileTap={{
              scale: 0.92,
            }}
            type="button"
            aria-label="عرض تفاصيل الوجبة"
            className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-white transition hover:border-[#d4af37]/40 hover:text-[#d4af37]"
          >
            <Eye size={20} />
          </motion.button>
        </div>
      </div>
    </motion.article>
  );
}