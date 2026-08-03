export type ProductOption = {
  id: string;
  name: string;
  price: number;
};

export type ProductSize = {
  id: string;
  name: string;
  price: number;
};

export type MenuProduct = {
  id: string;
  name: string;
  description?: string;
  category?: string;

  // السعر الذي يعتمد داخل السلة والطلب
  price: number;

  // بيانات العرض العام
  originalPrice?: number;
  offerPrice?: number;
  offerActive?: boolean;
  offerName?: string;
  offerType?: "percentage" | "fixed";
  offerValue?: number;
  discountAmount?: number;
  discountPercentage?: number;

  image?: string;
  featured?: boolean;
  available?: boolean;
  size?: string;
  sizes?: ProductSize[];
  extras?: ProductOption[];
};

export type SelectedProductExtra = {
  id: string;
  name: string;
  price: number;
};

export type ProductSelection = {
  productId: string;
  selectedSize?: ProductSize;
  selectedExtras: SelectedProductExtra[];
  quantity: number;
  note: string;
};