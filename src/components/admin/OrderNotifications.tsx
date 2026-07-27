"use client";

import {
  BellRing,
  Check,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { createClient } from "../../lib/supabase/client";

type RealtimeOrder = {
  id: string;
  customer_name: string | null;
  customer_phone: string | null;
  total: number | null;
  status: string | null;
  created_at: string | null;
};

type OrderInsertPayload = {
  new: Record<string, unknown>;
};

const SOUND_PATH = "/sounds/new-order.wav";
const SOUND_INTERVAL = 7000;
const SOUND_STORAGE_KEY = "zad-admin-sound-enabled";

function formatPrice(value: number | null) {
  return new Intl.NumberFormat("ar-IQ").format(
    Number(value ?? 0)
  );
}

function getOrderReference(id: string) {
  return id.slice(0, 8).toUpperCase();
}

function parseOrder(
  record: Record<string, unknown>
): RealtimeOrder {
  return {
    id: String(record.id ?? ""),
    customer_name:
      typeof record.customer_name === "string"
        ? record.customer_name
        : null,
    customer_phone:
      typeof record.customer_phone === "string"
        ? record.customer_phone
        : null,
    total:
      typeof record.total === "number"
        ? record.total
        : Number(record.total ?? 0),
    status:
      typeof record.status === "string"
        ? record.status
        : null,
    created_at:
      typeof record.created_at === "string"
        ? record.created_at
        : null,
  };
}

export default function OrderNotifications() {
  const router = useRouter();

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const repeatTimerRef =
    useRef<ReturnType<typeof setInterval> | null>(null);

  const [isReady, setIsReady] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [audioBlocked, setAudioBlocked] = useState(false);

  const [latestOrder, setLatestOrder] =
    useState<RealtimeOrder | null>(null);

  const [unseenCount, setUnseenCount] = useState(0);
  const [showAlert, setShowAlert] = useState(false);

  const stopSound = useCallback(() => {
    if (repeatTimerRef.current) {
      clearInterval(repeatTimerRef.current);
      repeatTimerRef.current = null;
    }

    const audio = audioRef.current;

    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
  }, []);

  const playSound = useCallback(async () => {
    const audio = audioRef.current;

    if (!audio || !soundEnabled) {
      return;
    }

    try {
      audio.currentTime = 0;
      audio.volume = 1;

      await audio.play();

      setAudioBlocked(false);
    } catch (error) {
      console.warn(
        "The browser blocked automatic audio playback:",
        error
      );

      setAudioBlocked(true);
    }
  }, [soundEnabled]);

  const startSound = useCallback(() => {
    stopSound();

    void playSound();

    repeatTimerRef.current = setInterval(() => {
      void playSound();
    }, SOUND_INTERVAL);
  }, [playSound, stopSound]);

  const enableSound = useCallback(async () => {
    const audio = audioRef.current;

    if (!audio) {
      return;
    }

    try {
      audio.volume = 1;
      audio.currentTime = 0;

      await audio.play();

      audio.pause();
      audio.currentTime = 0;

      localStorage.setItem(
        SOUND_STORAGE_KEY,
        "true"
      );

      setSoundEnabled(true);
      setAudioBlocked(false);
    } catch (error) {
      console.error(
        "Unable to enable order sound:",
        error
      );

      setAudioBlocked(true);
    }
  }, []);

  const disableSound = useCallback(() => {
    stopSound();

    localStorage.setItem(
      SOUND_STORAGE_KEY,
      "false"
    );

    setSoundEnabled(false);
    setAudioBlocked(false);
  }, [stopSound]);

  const acknowledgeOrders = useCallback(() => {
    stopSound();

    setShowAlert(false);
    setLatestOrder(null);
    setUnseenCount(0);
  }, [stopSound]);

  const hideAlert = useCallback(() => {
    stopSound();
    setShowAlert(false);
  }, [stopSound]);

  useEffect(() => {
    const audio = new Audio(SOUND_PATH);

    audio.preload = "auto";
    audio.volume = 1;

    audioRef.current = audio;

    const savedValue = localStorage.getItem(
      SOUND_STORAGE_KEY
    );

    setSoundEnabled(savedValue === "true");
    setIsReady(true);

    return () => {
      stopSound();

      audio.pause();
      audio.removeAttribute("src");
      audio.load();

      audioRef.current = null;
    };
  }, [stopSound]);

  useEffect(() => {
    if (!isReady) {
      return;
    }

    const supabase = createClient();

    const channel = supabase
      .channel("zad-admin-orders-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "orders",
        },
        (payload: OrderInsertPayload) => {
          const newOrder = parseOrder(payload.new);

          if (!newOrder.id) {
            console.warn(
              "Realtime order does not contain an ID."
            );

            return;
          }

          setLatestOrder(newOrder);

          setUnseenCount(
            (currentCount) => currentCount + 1
          );

          setShowAlert(true);

          router.refresh();

          if (soundEnabled) {
            startSound();
          }
        }
      )
      .subscribe((status: string) => {
        console.log(
          "Orders Realtime status:",
          status
        );
      });

    return () => {
      stopSound();
      void supabase.removeChannel(channel);
    };
  }, [
    isReady,
    router,
    soundEnabled,
    startSound,
    stopSound,
  ]);

  if (!isReady) {
    return null;
  }

  return (
    <>
      <div
        dir="rtl"
        className="fixed bottom-5 left-5 z-[90] flex flex-wrap items-center gap-2"
      >
        {unseenCount > 0 && (
          <button
            type="button"
            onClick={() => setShowAlert(true)}
            className="relative flex h-12 items-center gap-2 rounded-full bg-red-600 px-4 text-sm font-bold text-white shadow-xl transition hover:bg-red-700"
          >
            <BellRing className="h-5 w-5 animate-pulse" />

            <span>
              {unseenCount} طلب جديد
            </span>

            <span className="absolute -right-2 -top-2 flex h-6 min-w-6 items-center justify-center rounded-full bg-white px-1 text-xs font-black text-red-600 shadow">
              {unseenCount}
            </span>
          </button>
        )}

        {soundEnabled ? (
          <button
            type="button"
            onClick={disableSound}
            title="إيقاف صوت الطلبات"
            className="flex h-12 items-center gap-2 rounded-full bg-emerald-600 px-4 text-sm font-bold text-white shadow-xl transition hover:bg-emerald-700"
          >
            <Volume2 className="h-5 w-5" />
            الصوت مفعّل
          </button>
        ) : (
          <button
            type="button"
            onClick={enableSound}
            className="flex h-12 items-center gap-2 rounded-full bg-amber-500 px-4 text-sm font-bold text-black shadow-xl transition hover:bg-amber-400"
          >
            <VolumeX className="h-5 w-5" />
            فعّل صوت الطلبات
          </button>
        )}
      </div>

      {audioBlocked && (
        <div
          dir="rtl"
          className="fixed bottom-20 left-5 z-[95] max-w-sm rounded-2xl border border-amber-400/30 bg-zinc-950 p-4 text-sm text-white shadow-2xl"
        >
          المتصفح منع تشغيل الصوت تلقائيًا. اضغط
          زر{" "}
          <strong className="text-amber-400">
            فعّل صوت الطلبات
          </strong>{" "}
          مرة واحدة.
        </div>
      )}

      {showAlert && latestOrder && (
        <div
          dir="rtl"
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
        >
          <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-red-500/40 bg-zinc-950 shadow-2xl">
            <button
              type="button"
              onClick={hideAlert}
              aria-label="إغلاق التنبيه"
              className="absolute left-4 top-4 z-10 rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="bg-gradient-to-l from-red-700 to-red-500 px-6 py-7 text-center text-white">
              <BellRing className="mx-auto mb-3 h-14 w-14 animate-bounce" />

              <h2 className="text-3xl font-black">
                وصل طلب جديد
              </h2>

              <p className="mt-2 text-sm text-white/80">
                يرجى مراجعة الطلب وتأكيد استلامه
              </p>
            </div>

            <div className="space-y-4 p-6 text-white">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-white/5 p-4">
                  <p className="text-xs text-zinc-400">
                    رقم الطلب
                  </p>

                  <p className="mt-1 font-black text-amber-400">
                    #
                    {getOrderReference(
                      latestOrder.id
                    )}
                  </p>
                </div>

                <div className="rounded-2xl bg-white/5 p-4">
                  <p className="text-xs text-zinc-400">
                    المبلغ
                  </p>

                  <p className="mt-1 font-black text-emerald-400">
                    {formatPrice(
                      latestOrder.total
                    )}{" "}
                    د.ع
                  </p>
                </div>
              </div>

              <div className="rounded-2xl bg-white/5 p-4">
                <p className="text-xs text-zinc-400">
                  اسم الزبون
                </p>

                <p className="mt-1 text-lg font-bold">
                  {latestOrder.customer_name ||
                    "بدون اسم"}
                </p>
              </div>

              {latestOrder.customer_phone && (
                <div className="rounded-2xl bg-white/5 p-4">
                  <p className="text-xs text-zinc-400">
                    رقم الهاتف
                  </p>

                  <p
                    dir="ltr"
                    className="mt-1 text-right font-bold"
                  >
                    {latestOrder.customer_phone}
                  </p>
                </div>
              )}

              {unseenCount > 1 && (
                <div className="rounded-2xl border border-amber-400/30 bg-amber-400/10 p-4 text-center text-sm font-bold text-amber-300">
                  يوجد {unseenCount} طلبات جديدة غير
                  مشاهدة
                </div>
              )}

              {!soundEnabled && (
                <button
                  type="button"
                  onClick={enableSound}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-amber-500 px-5 py-3 font-black text-black transition hover:bg-amber-400"
                >
                  <Volume2 className="h-5 w-5" />
                  تفعيل صوت تنبيهات الطلبات
                </button>
              )}

              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => {
                    const orderId = latestOrder.id;

                    acknowledgeOrders();

                    router.push(
                      `/admin/orders/${orderId}`
                    );
                  }}
                  className="rounded-2xl bg-white px-5 py-4 font-black text-black transition hover:bg-zinc-200"
                >
                  فتح تفاصيل الطلب
                </button>

                <button
                  type="button"
                  onClick={acknowledgeOrders}
                  className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-4 font-black text-white transition hover:bg-emerald-700"
                >
                  <Check className="h-5 w-5" />
                  تمت المشاهدة
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}