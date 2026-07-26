import { MessageCircle } from "lucide-react";

const WHATSAPP_NUMBER = "9647722032536";

const WHATSAPP_MESSAGE = encodeURIComponent(
  "السلام عليكم، أريد الاستفسار عن طلب من مطبخ زاد."
);

export default function ContactSection() {
  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${WHATSAPP_MESSAGE}`;

  return (
    <section
      id="contact"
      className="mx-auto max-w-5xl px-4 py-24 text-center sm:px-8"
    >
      <p className="text-sm font-black tracking-[0.25em] text-[#d4af37]">
        تواصل معنا
      </p>

      <h2 className="mt-4 text-4xl font-black sm:text-5xl">
        طلبك أقرب مما تتوقع
      </h2>

      <p className="mx-auto mt-5 max-w-xl leading-8 text-white/50">
        تواصل ويانا عبر واتساب أو تابع حسابات مطبخ زاد الرسمية.
      </p>

      <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#d4af37] px-8 py-4 font-black text-black transition hover:-translate-y-1 hover:bg-[#efd36d] sm:w-auto"
        >
          <MessageCircle size={20} />
          اطلب عبر واتساب
        </a>

        <a
          href="https://www.instagram.com/zad_kt"
          target="_blank"
          rel="noreferrer"
          className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/15 px-8 py-4 font-black transition hover:border-[#d4af37]/60 hover:text-[#d4af37] sm:w-auto"
        >
          <span className="text-xl font-black">◎</span>
          zad_kt
        </a>

        <a
          href="#"
          className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/15 px-8 py-4 font-black transition hover:border-[#d4af37]/60 hover:text-[#d4af37] sm:w-auto"
          title="فيسبوك مطبخ زاد"
        >
          <span className="text-xl font-black">f</span>
          مطبخ زاد
        </a>
      </div>
    </section>
  );
}