"use client";

import { ShoppingCart } from "lucide-react";

import { useCart } from "../../context/cart-context";

export default function CartButton() {
  const { openCart, totalItems } = useCart();

  return (
    <button
      type="button"
      onClick={openCart}
      aria-label="فتح سلة الطلب"
      className="fixed bottom-5 left-5 z-40 flex h-16 w-16 items-center justify-center rounded-full border border-[#d4af37]/40 bg-[#d4af37] text-black shadow-[0_10px_40px_rgba(212,175,55,0.35)] transition hover:scale-105 hover:bg-[#efd46b] active:scale-95"
    >
      <ShoppingCart size={27} />

      {totalItems > 0 && (
        <span className="absolute -right-1 -top-1 flex min-h-6 min-w-6 items-center justify-center rounded-full border-2 border-black bg-red-600 px-1 text-xs font-black text-white">
          {totalItems > 99 ? "99+" : totalItems}
        </span>
      )}
    </button>
  );
}