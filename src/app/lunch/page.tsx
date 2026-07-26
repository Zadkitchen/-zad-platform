import ProductCard from "../../components/ProductCard";
import { lunchProducts } from "../../data/lunch-products";

export default function LunchPage() {
  const categories = Array.from(
    new Set(lunchProducts.map((product) => product.category))
  );

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
            منيو الغداء
          </h1>

          <p className="mt-3 text-neutral-400">
            اختر وجبتك وأضفها مباشرة إلى السلة
          </p>
        </header>

        <div className="space-y-12">
          {categories.map((category) => {
            const products = lunchProducts.filter(
              (product) => product.category === category
            );

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
      </div>
    </main>
  );
}