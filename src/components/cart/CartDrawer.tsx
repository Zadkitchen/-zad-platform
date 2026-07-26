"use client";

import { ShoppingBag, X } from "lucide-react";
import { useEffect, useState } from "react";

import { useCart } from "../../context/cart-context";
import CartItem from "./CartItem";

const WHATSAPP_NUMBER = "9647722032536";

function formatPrice(price: number) {
  return new Intl.NumberFormat("ar-US").format(price);
}

export default function CartDrawer() {
  const {
    items,
    isCartOpen,
    subtotal,
    totalItems,
    closeCart,
    clearCart,
  } = useCart();

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [orderNote, setOrderNote] = useState("");

  useEffect(() => {
    if (!isCartOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isCartOpen]);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeCart();
      }
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, [closeCart]);

   const createWhatsAppMessage = () => {
    const orderItems = items
      .map((item, index) => {
        const itemTotal = item.price * item.quantity;

        return [
          String(index + 1) + "- " + item.name,
          item.size ? "الحجم: " + item.size : "",
          "الكمية: " + item.quantity,
          "السعر: " + formatPrice(item.price) + " د.ع",
          "مجموع الصنف: " + formatPrice(itemTotal) + " د.ع",
          item.note ? "ملاحظة الصنف: " + item.note : "",
        ]
          .filter(Boolean)
          .join("\n");
      })
      .join("\n\n");

    return [
      "السلام عليكم، أريد تأكيد طلب من مطبخ زاد:",
      "",
      orderItems,
      "",
      "━━━━━━━━━━━━",
      "عدد القطع: " + totalItems,
      "المجموع الكلي: " + formatPrice(subtotal) + " د.ع",
      "━━━━━━━━━━━━",
      "",
      "الاسم: " + (customerName || "غير مذكور"),
      "رقم الهاتف: " + (customerPhone || "غير مذكور"),
      "العنوان: " + (customerAddress || "غير مذكور"),
      orderNote
        ? "ملاحظات الطلب: " + orderNote
        : "ملاحظات الطلب: لا توجد",
      "",
      "زاد... نكهة تستحق العودة",
    ].join("\n");
  };

  const handleCheckout = () => {
    if (items.length === 0) return;

    if (!customerName.trim()) {
      alert("يرجى كتابة اسم الزبون");
      return;
    }

    if (!customerPhone.trim()) {
      alert("يرجى كتابة رقم الهاتف");
      return;
    }

    if (!customerAddress.trim()) {
      alert("يرجى كتابة عنوان التوصيل");
      return;
    }

    const message = createWhatsAppMessage();

  const whatsappUrl =
      "https://wa.me/" +
      WHATSAPP_NUMBER +
      "?text=" +
      encodeURIComponent(message);
    window.open(
      whatsappUrl,
      "_blank",
      "noopener,noreferrer"
    );
  };
  return (
    <>
      <div
        onClick={closeCart}
        aria-hidden="true"
        className={`fixed inset-0 z-50 bg-black/75 backdrop-blur-sm transition-opacity duration-300 ${
          isCartOpen
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0"
        }`}
      />

      <aside
        dir="rtl"
        role="dialog"
        aria-modal="true"
        aria-label="سلة طلب مطبخ زاد"
        className={`fixed right-0 top-0 z-[60] flex h-dvh w-full max-w-[470px] flex-col border-l border-[#d4af37]/20 bg-[#0b0b0b] shadow-2xl transition-transform duration-300 ${
          isCartOpen
            ? "translate-x-0"
            : "translate-x-full"
        }`}
      >
        <header className="flex items-center justify-between border-b border-white/10 px-5 py-5">
          <div>
            <p className="text-xs tracking-[0.25em] text-[#d4af37]">
              ZAD KITCHEN
            </p>

            <h2 className="mt-1 text-2xl font-black text-white">
              سلة الطلب
            </h2>
          </div>

          <button
            type="button"
            onClick={closeCart}
            aria-label="إغلاق السلة"
            className="rounded-full border border-white/10 bg-white/5 p-2.5 text-white transition hover:border-[#d4af37]/50 hover:text-[#d4af37]"
          >
            <X size={23} />
          </button>
        </header>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
            <div className="flex h-24 w-24 items-center justify-center rounded-full border border-[#d4af37]/20 bg-[#d4af37]/5 text-[#d4af37]">
              <ShoppingBag size={42} />
            </div>

            <h3 className="mt-6 text-xl font-bold text-white">
              السلة فارغة
            </h3>

            <p className="mt-2 max-w-xs leading-7 text-neutral-400">
              اختر وجبتك المفضلة من منيو زاد واضغط على زر
              أضف للسلة.
            </p>

            <button
              type="button"
              onClick={closeCart}
              className="mt-6 rounded-xl bg-[#d4af37] px-7 py-3 font-bold text-black transition hover:bg-[#efd46b]"
            >
              تصفح المنيو
            </button>
          </div>
        ) : (
          <>
            <div className="flex-1 space-y-4 overflow-y-auto px-4 py-5">
              {items.map((item) => (
                <CartItem key={item.id} item={item} />
              ))}
              <section className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                <h3 className="mb-4 text-lg font-bold text-white">
                  معلومات التوصيل
                </h3>

                <div className="space-y-3">
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="اسم الزبون"
                    className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none"
                  />

                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="رقم الهاتف"
                    className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none"
                  />

                  <textarea
                    rows={3}
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                    placeholder="عنوان التوصيل"
                    className="w-full resize-none rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none"
                  />

                  <textarea
                    rows={3}
                    value={orderNote}
                    onChange={(e) => setOrderNote(e.target.value)}
                    placeholder="ملاحظات إضافية"
                    className="w-full resize-none rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none"
                  />
                </div>
              </section>
            </div>
<footer className="border-t border-white/10 bg-[#0d0d0d] px-5 py-5">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-neutral-400">
                  المجموع الكلي
                </span>

                <span className="text-2xl font-black text-[#d4af37]">
                  {formatPrice(subtotal)} د.ع
                </span>
              </div>

              <div className="grid grid-cols-[1fr_auto] gap-3">
                <button
                  type="button"
                  onClick={handleCheckout}
                  className="rounded-xl bg-[#d4af37] px-5 py-4 font-black text-black transition hover:bg-[#efd46b] active:scale-[0.99]"
                >
                  إرسال الطلب إلى واتساب
                </button>

                <button
                  type="button"
                  onClick={clearCart}
                  className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-4 font-bold text-red-400 transition hover:bg-red-500/20"
                >
                  تفريغ
                </button>
              </div>
            </footer>
          </>
        )}
      </aside>
    </>
  );
}