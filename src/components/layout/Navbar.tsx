"use client";

import { Menu, X } from "lucide-react";
import { useState } from "react";

import CartButton from "../cart/CartButton";

const links = [
  { label: "الرئيسية", href: "#home" },
  { label: "المنيو", href: "#menus" },
  { label: "لماذا زاد؟", href: "#features" },
  { label: "التقييمات", href: "#reviews" },
  { label: "تواصل معنا", href: "#contact" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[#080808]/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-8">
        <a href="#home" aria-label="العودة إلى الرئيسية">
          <div className="text-3xl font-black tracking-[0.14em] text-[#d4af37]">
            ZAD
          </div>

          <div className="text-[9px] tracking-[0.32em] text-white/45">
            KITCHEN
          </div>
        </a>

        <nav className="hidden items-center gap-7 text-sm font-bold lg:flex">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-white/65 transition hover:text-[#d4af37]"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <CartButton />

          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-label={open ? "إغلاق القائمة" : "فتح القائمة"}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] lg:hidden"
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {open && (
        <nav className="border-t border-white/10 bg-[#0d0d0d] px-4 py-4 lg:hidden">
          <div className="mx-auto flex max-w-7xl flex-col">
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="border-b border-white/5 px-2 py-4 font-bold text-white/75 last:border-b-0 hover:text-[#d4af37]"
              >
                {link.label}
              </a>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}