import { Quote, Star } from "lucide-react";

const reviews = [
  {
    name: "زبون زاد",
    text: "الطعم مرتب والتغليف نظيف، والطلب وصل بحالة ممتازة.",
  },
  {
    name: "زبون زاد",
    text: "تنوع المنيو حلو، وكل شخص يقدر يختار الوجبة المناسبة إله.",
  },
  {
    name: "زبون زاد",
    text: "واضح الاهتمام بالتفاصيل من التحضير إلى استلام الطلب.",
  },
];

export default function TestimonialsSection() {
  return (
    <section id="reviews" className="mx-auto max-w-7xl px-4 py-24 sm:px-8">
      <div className="mb-12 text-center">
        <p className="text-sm font-black tracking-[0.25em] text-[#d4af37]">
          تجربة زاد
        </p>

        <h2 className="mt-4 text-4xl font-black sm:text-5xl">
          آراء نعتز بها
        </h2>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        {reviews.map((review, index) => (
          <article
            key={index}
            className="relative overflow-hidden rounded-[28px] border border-white/10 bg-[#111111] p-7"
          >
            <Quote className="absolute -left-2 -top-3 h-24 w-24 text-[#d4af37]/5" />

            <div className="relative">
              <div className="flex gap-1 text-[#d4af37]">
                {Array.from({ length: 5 }).map((_, star) => (
                  <Star
                    key={star}
                    size={17}
                    fill="currentColor"
                  />
                ))}
              </div>

              <p className="mt-6 min-h-24 leading-8 text-white/65">
                "{review.text}"
              </p>

              <p className="mt-6 font-black text-[#d4af37]">
                {review.name}
              </p>
            </div>
          </article>
        ))}
      </div>

      <p className="mt-5 text-center text-xs text-white/25">
        استبدل هذه التقييمات بتقييمات العملاء الحقيقية بعد الافتتاح.
      </p>
    </section>
  );
}