"use client";

import { Minus, Plus, Trash2 } from "lucide-react";

import type { CartItem as CartItemType } from "../../types/cart";
import { useCart } from "../../context/cart-context";

type CartItemProps = {
  item: CartItemType;
};

function formatPrice(price: number) {
  return new Intl.NumberFormat("ar-US").format(price);
}

export default function CartItem({ item }: CartItemProps) {
  const {
    increaseQuantity,
    decreaseQuantity,
    removeItem,
  } = useCart();

  const itemTotal = item.price * item.quantity;

  return (
    <article className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-lg font-bold text-white">
            {item.name}
          </h3>

          {item.size && (
            <p className="mt-1 text-sm text-neutral-400">
              الحجم: {item.size}
            </p>
          )}

          <p className="mt-2 font-bold text-[#d4af37]">
            {formatPrice(item.price)} د.ع
          </p>
        </div>

        <button
          type="button"
          onClick={() => removeItem(item.id)}
          aria-label={`حذف ${item.name}`}
          className="rounded-lg border border-red-500/20 bg-red-500/10 p-2 text-red-400 transition hover:bg-red-500/20"
        >
          <Trash2 size={18} />
        </button>
      </div>

      <div className="mt-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/30 p-1">
          <button
            type="button"
            onClick={() => decreaseQuantity(item.id)}
            aria-label={`تقليل كمية ${item.name}`}
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/5 text-white transition hover:bg-[#d4af37] hover:text-black"
          >
            <Minus size={17} />
          </button>

          <span className="min-w-7 text-center font-bold text-white">
            {item.quantity}
          </span>

          <button
            type="button"
            onClick={() => increaseQuantity(item.id)}
            aria-label={`زيادة كمية ${item.name}`}
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#d4af37] text-black transition hover:bg-[#efd46b]"
          >
            <Plus size={17} />
          </button>
        </div>

        <div className="text-left">
          <p className="text-xs text-neutral-500">
            مجموع الصنف
          </p>

          <p className="mt-1 font-black text-white">
            {formatPrice(itemTotal)} د.ع
          </p>
        </div>
      </div>
    </article>
  );
}