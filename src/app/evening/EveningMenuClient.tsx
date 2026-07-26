"use client";

import { useMemo, useState } from "react";

import MenuToolbar from "../../components/menu/MenuToolbar";
import ProductCard from "../../components/ProductCard";
import type { MenuProduct } from "../../types/menu";

type EveningMenuClientProps = {
  products: MenuProduct[];
};

export default function EveningMenuClient({
  products,
}: EveningMenuClientProps) {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] =
    useState("");

  const categories = useMemo(() => {
    return Array.from(
      new Set(
        products
          .map((product) => product.category)
          .filter(
            (category): category is string =>
              typeof category === "string" &&
              category.trim().length > 0
          )
      )
    );
  }, [products]);

  const filteredProducts = useMemo(() => {
    const normalizedSearch = search
      .trim()
      .toLowerCase();

    return products.filter((product) => {
      const productCategory =
        product.category ?? "";

      const matchesCategory =
        activeCategory === "" ||
        productCategory === activeCategory;

      const matchesSearch =
        normalizedSearch === "" ||
        product.name
          .toLowerCase()
          .includes(normalizedSearch) ||
        productCategory
          .toLowerCase()
          .includes(normalizedSearch);

      return matchesCategory && matchesSearch;
    });
  }, [products, search, activeCategory]);

  const visibleCategories = activeCategory
    ? [activeCategory]
    : categories;

  return (
    <>
      <MenuToolbar
        search={search}
        onSearchChange={setSearch}
        categories={categories}
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
      />

      {filteredProducts.length === 0 ? (
        <div className="rounded-3xl border border-white/10 bg-[#111] px-6 py-16 text-center">
          <p className="text-2xl font-black text-[#d4af37]">
            لا توجد وجبات حاليًا
          </p>

          <p className="mt-3 text-white/50">
            جرّب البحث باسم آخر أو اختر تصنيفًا
            مختلفًا.
          </p>

          <button
            type="button"
            onClick={() => {
              setSearch("");
              setActiveCategory("");
            }}
            className="mt-6 rounded-full border border-[#d4af37]/50 px-6 py-3 font-bold text-[#d4af37] transition hover:bg-[#d4af37] hover:text-black"
          >
            عرض كل الوجبات
          </button>
        </div>
      ) : (
        <div className="space-y-12">
          {visibleCategories.map((category) => {
            const categoryProducts =
              filteredProducts.filter(
                (product) =>
                  product.category === category
              );

            if (categoryProducts.length === 0) {
              return null;
            }

            return (
              <section key={category}>
                <div className="mb-5 flex items-center gap-3">
                  <span className="h-px flex-1 bg-white/10" />

                  <h2 className="text-2xl font-black text-[#d4af37]">
                    {category}
                  </h2>

                  <span className="h-px flex-1 bg-white/10" />
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {categoryProducts.map(
                    (product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                      />
                    )
                  )}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </>
  );
}