"use client";

import { Search } from "lucide-react";

type Props = {
  search: string;
  onSearchChange: (value: string) => void;
  categories: string[];
  activeCategory: string;
  onCategoryChange: (value: string) => void;
};

export default function MenuToolbar({
  search,
  onSearchChange,
  categories,
  activeCategory,
  onCategoryChange,
}: Props) {
  return (
    <div className="mb-8 space-y-5">
      <div className="relative">
        <Search
          size={20}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40"
        />

        <input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="ابحث عن وجبة..."
          className="w-full rounded-2xl border border-white/10 bg-[#111] py-4 pr-12 pl-4 outline-none transition focus:border-[#d4af37] text-white"
        />
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2">
        <button
          onClick={() => onCategoryChange("")}
          className={`rounded-full px-5 py-2 font-bold whitespace-nowrap ${
            activeCategory === ""
              ? "bg-[#d4af37] text-black"
              : "bg-white/5 text-white"
          }`}
        >
          الكل
        </button>

        {categories.map((category) => (
          <button
            key={category}
            onClick={() => onCategoryChange(category)}
            className={`rounded-full px-5 py-2 font-bold whitespace-nowrap ${
              activeCategory === category
                ? "bg-[#d4af37] text-black"
                : "bg-white/5 text-white"
            }`}
          >
            {category}
          </button>
        ))}
      </div>
    </div>
  );
}