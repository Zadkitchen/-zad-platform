"use client";

import { useMemo, useState } from "react";

import MenuToolbar from "../../components/menu/MenuToolbar";
import ProductCard from "../../components/ProductCard";
import { eveningProducts } from "../../data/evening-products";

export default function EveningPage() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("");

  const categories = useMemo(() => {
    return Array.from(
      new Set(
        eveningProducts
          .map((product) => product.category)
          .filter(
            (category): category is string =>
              typeof category === "string" && category.length > 0
          )
      )
    );
  }, []);

  const filteredProducts = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return eveningProducts.filter((product) => {
      const productCategory = product.category ?? "";

      const matchesCategory =
        activeCategory === "" ||
        productCategory === activeCategory;

      const matchesSearch =
        normalizedSearch === "" ||
        product.name.toLowerCase().includes(normalizedSearch) ||
        productCategory.toLowerCase().includes(normalizedSearch);

      return matchesCategory && matchesSearch;
    });
  }, [search, activeCategory]);

  const visibleCategories = activeCategory
    ? [activeCategory]
    : categories;

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-[#090909] px-4 py-10 text-white"
    >
      <div className="mx-auto max-w-7xl">
        <header className="mb-10 text-center">
          <p className="text-sm font-bold tracking-[0.3em] text-[#d4af37]">
            ZAD KITCHEN
          </p>

          <h1 className="mt-3 text-4xl font-black">
            المنيو المسائي
          </h1>

          <p className="mt-3 text-neutral-400">
            ابحث عن وجبتك أو اختر التصنيف المناسب
          </p>
        </header>

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
              ما لقينا نتائج
            </p>

            <p className="mt-3 text-white/50">
              جرّب تكتب اسم ثاني أو اختار تصنيف مختلف.
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
              const products = filteredProducts.filter(
                (product): product is (typeof eveningProducts)[number] & { category: string } =>
                  product.category === category
              );

              if (products.length === 0) return null;

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
                    {products.map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                      />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}