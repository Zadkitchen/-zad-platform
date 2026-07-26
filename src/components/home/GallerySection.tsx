const galleryItems = [
  {
    label: "غداء عراقي",
    className: "md:col-span-2 md:row-span-2",
  },
  {
    label: "بيتزا زاد",
    className: "",
  },
  {
    label: "كرسبي",
    className: "",
  },
  {
    label: "بركر",
    className: "",
  },
  {
    label: "ريزو",
    className: "",
  },
];

export default function GallerySection() {
  return (
    <section className="border-y border-white/10 bg-[#101010]">
      <div className="mx-auto max-w-7xl px-4 py-24 sm:px-8">
        <div className="mb-12 text-center">
          <p className="text-sm font-black tracking-[0.25em] text-[#d4af37]">
            من مطبخنا
          </p>

          <h2 className="mt-4 text-4xl font-black sm:text-5xl">
            معرض زاد
          </h2>

          <p className="mx-auto mt-5 max-w-xl leading-8 text-white/50">
            هذه أماكن جاهزة لصور الوجبات الحقيقية عند توفر التصوير الاحترافي.
          </p>
        </div>

        <div className="grid auto-rows-[210px] gap-4 md:grid-cols-4">
          {galleryItems.map((item, index) => (
            <div
              key={item.label}
              className={`group relative overflow-hidden rounded-[28px] border border-white/10 bg-[#151515] ${item.className}`}
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(212,175,55,0.20),transparent_60%)] transition duration-500 group-hover:scale-110" />

              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent" />

              <span className="absolute bottom-5 right-5 text-xl font-black">
                {item.label}
              </span>

              <span className="absolute left-5 top-5 text-xs font-bold text-white/25">
                0{index + 1}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}