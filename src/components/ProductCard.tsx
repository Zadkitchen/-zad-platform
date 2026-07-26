"use client";

import { Plus } from "lucide-react";

import { useCart } from "../context/cart-context";
import type { EveningProduct } from "../data/evening-products";
type ProductCardProps = {
  product: EveningProduct;
};

function formatPrice(price: number) {
  return new Intl.NumberFormat("ar-US").format(price);
}

export default function ProductCard({
  product,
}: ProductCardProps) {
  const { addItem } = useCart();

  return (
    <article className="rounded-2xl border border-white/10 bg-white/[0.035] p-4 transition hover:border-[#d4af37]/40 hover:bg-white/[0.055]">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold text-[#d4af37]">
            {product.category}
          </p>

          <h3 className="mt-2 text-lg font-black text-white">
            {product.name}
          </h3>

          {product.size && (
            <p className="mt-1 text-sm text-neutral-400">
              الحجم: {product.size}
            </p>
          )}

          {product.description && (
            <p className="mt-2 leading-6 text-neutral-400">
              {product.description}
            </p>
          )}
        </div>

        <div className="shrink-0 text-left">
          <p className="text-lg font-black text-[#d4af37]">
            {formatPrice(product.price)} د.ع
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={() => addItem(product)}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#d4af37] px-4 py-3 font-black text-black transition hover:bg-[#efd46b] active:scale-[0.98]"
      >
        <Plus size={18} />
        أضف للسلة
      </button>
    </article>
  );
}