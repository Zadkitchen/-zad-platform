export type CartProduct = {
  id: string;
  name: string;
  price: number;
  image?: string;
  category?: string;
  size?: string;
};

export type CartItem = CartProduct & {
  quantity: number;
  note?: string;
};