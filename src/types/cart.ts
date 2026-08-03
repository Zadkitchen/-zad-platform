export type CartProduct = {
  id: string;
  name: string;

  // السعر النهائي المعتمد بعد العرض
  price: number;

  // السعر الأصلي قبل العرض
  originalPrice?: number;

  offerActive?: boolean;
  offerName?: string;
  offerType?: "percentage" | "fixed";
  offerValue?: number;
  discountAmount?: number;
  discountPercentage?: number;

  image?: string;
  category?: string;
  size?: string;
};

export type CartItem = CartProduct & {
  quantity: number;
  note?: string;
};