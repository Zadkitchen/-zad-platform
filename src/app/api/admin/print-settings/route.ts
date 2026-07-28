import { NextRequest, NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

const allowedPaperSizes = ["58mm", "80mm"] as const;

const allowedPrintOrders = [
  "kitchen_first",
  "customer_first",
  "driver_first",
] as const;

const allowedConnections = [
  "not_connected",
  "usb",
  "network",
  "wifi",
] as const;

function isCopyCount(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= 0 &&
    value <= 5
  );
}

export async function GET() {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("print_settings")
      .select("*")
      .order("id", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("GET print settings error:", error);

      return NextResponse.json(
        { error: "تعذر تحميل إعدادات الطباعة" },
        { status: 500 },
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: "لم يتم العثور على إعدادات الطباعة" },
        { status: 404 },
      );
    }

    return NextResponse.json({ settings: data });
  } catch (error) {
    console.error("GET print settings unexpected error:", error);

    return NextResponse.json(
      { error: "حدث خطأ غير متوقع" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      id,
      auto_print_enabled,
      paper_size,
      kitchen_copy_enabled,
      kitchen_copy_count,
      customer_copy_enabled,
      customer_copy_count,
      driver_copy_enabled,
      driver_copy_count,
      print_order,
      printer_name,
      printer_connection,
    } = body;

    if (!id || typeof id !== "number") {
      return NextResponse.json(
        { error: "معرّف إعدادات الطباعة غير صحيح" },
        { status: 400 },
      );
    }

    if (typeof auto_print_enabled !== "boolean") {
      return NextResponse.json(
        { error: "قيمة الطباعة التلقائية غير صحيحة" },
        { status: 400 },
      );
    }

    if (!allowedPaperSizes.includes(paper_size)) {
      return NextResponse.json(
        { error: "حجم الورق غير صحيح" },
        { status: 400 },
      );
    }

    if (
      typeof kitchen_copy_enabled !== "boolean" ||
      !isCopyCount(kitchen_copy_count)
    ) {
      return NextResponse.json(
        { error: "إعدادات نسخة المطبخ غير صحيحة" },
        { status: 400 },
      );
    }

    if (
      typeof customer_copy_enabled !== "boolean" ||
      !isCopyCount(customer_copy_count)
    ) {
      return NextResponse.json(
        { error: "إعدادات نسخة الزبون غير صحيحة" },
        { status: 400 },
      );
    }

    if (
      typeof driver_copy_enabled !== "boolean" ||
      !isCopyCount(driver_copy_count)
    ) {
      return NextResponse.json(
        { error: "إعدادات نسخة السائق غير صحيحة" },
        { status: 400 },
      );
    }

    if (!allowedPrintOrders.includes(print_order)) {
      return NextResponse.json(
        { error: "ترتيب الطباعة غير صحيح" },
        { status: 400 },
      );
    }

    if (!allowedConnections.includes(printer_connection)) {
      return NextResponse.json(
        { error: "نوع اتصال الطابعة غير صحيح" },
        { status: 400 },
      );
    }

    const supabase = await createClient();

    const { data, error } = await supabase
      .from("print_settings")
      .update({
        auto_print_enabled,
        paper_size,

        kitchen_copy_enabled,
        kitchen_copy_count:
          kitchen_copy_enabled && kitchen_copy_count === 0
            ? 1
            : kitchen_copy_count,

        customer_copy_enabled,
        customer_copy_count:
          customer_copy_enabled && customer_copy_count === 0
            ? 1
            : customer_copy_count,

        driver_copy_enabled,
        driver_copy_count:
          driver_copy_enabled && driver_copy_count === 0
            ? 1
            : driver_copy_count,

        print_order,

        printer_name:
          typeof printer_name === "string" && printer_name.trim()
            ? printer_name.trim()
            : null,

        printer_connection,
      })
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      console.error("PATCH print settings error:", error);

      return NextResponse.json(
        { error: "تعذر حفظ إعدادات الطباعة" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      message: "تم حفظ إعدادات الطباعة بنجاح",
      settings: data,
    });
  } catch (error) {
    console.error("PATCH print settings unexpected error:", error);

    return NextResponse.json(
      { error: "حدث خطأ غير متوقع أثناء الحفظ" },
      { status: 500 },
    );
  }
}