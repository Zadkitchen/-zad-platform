"use client";

import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import type {
  CartItem,
  CartProduct,
} from "../types/cart";

type CartContextType = {
  items: CartItem[];
  isCartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  addItem: (
    product: CartProduct,
    quantity?: number
  ) => void;
  increaseQuantity: (id: string) => void;
  decreaseQuantity: (id: string) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
  totalItems: number;
  originalSubtotal: number;
  offerDiscount: number;
  subtotal: number;
};

const CartContext =
  createContext<CartContextType | null>(null);

const STORAGE_KEY = "zad-kitchen-cart";

type CartProviderProps = {
  children: ReactNode;
};

function cleanPositiveNumber(
  value: unknown,
  fallback = 0
) {
  const number = Number(value);

  if (!Number.isFinite(number) || number < 0) {
    return fallback;
  }

  return number;
}

function normalizeCartProduct(
  product: CartProduct
): CartProduct {
  const finalPrice = cleanPositiveNumber(
    product.price
  );

  const originalPrice = Math.max(
    finalPrice,
    cleanPositiveNumber(
      product.originalPrice,
      finalPrice
    )
  );

  const discountAmount = Math.max(
    0,
    originalPrice - finalPrice
  );

  const offerActive =
    product.offerActive === true &&
    discountAmount > 0;

  return {
    ...product,
    price: finalPrice,
    originalPrice,
    offerActive,
    discountAmount: offerActive
      ? discountAmount
      : 0,
    discountPercentage:
      offerActive && originalPrice > 0
        ? Math.round(
            (discountAmount / originalPrice) *
              100
          )
        : 0,
  };
}

function normalizeStoredCart(
  value: unknown
): CartItem[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const normalizedItems: CartItem[] = [];

  for (const item of value) {
    if (
      !item ||
      typeof item !== "object"
    ) {
      continue;
    }

    const storedItem =
      item as Partial<CartItem>;

    const id = String(
      storedItem.id ?? ""
    ).trim();

    const name = String(
      storedItem.name ?? ""
    ).trim();

    if (!id || !name) {
      continue;
    }

    const quantity = Math.max(
      1,
      Math.floor(
        cleanPositiveNumber(
          storedItem.quantity,
          1
        )
      )
    );

    const normalizedProduct =
      normalizeCartProduct({
        id,
        name,
        price: cleanPositiveNumber(
          storedItem.price
        ),
        originalPrice:
          storedItem.originalPrice,
        offerActive:
          storedItem.offerActive,
        offerName:
          storedItem.offerName,
        offerType:
          storedItem.offerType,
        offerValue:
          storedItem.offerValue,
        discountAmount:
          storedItem.discountAmount,
        discountPercentage:
          storedItem.discountPercentage,
        image: storedItem.image,
        category: storedItem.category,
        size: storedItem.size,
      });

    normalizedItems.push({
      ...normalizedProduct,
      quantity,
      note:
        typeof storedItem.note === "string"
          ? storedItem.note
          : undefined,
    });
  }

  return normalizedItems;
}

export function CartProvider({
  children,
}: CartProviderProps) {
  const [items, setItems] =
    useState<CartItem[]>([]);

  const [isCartOpen, setIsCartOpen] =
    useState(false);

  const [isLoaded, setIsLoaded] =
    useState(false);

  useEffect(() => {
    try {
      const savedCart =
        window.localStorage.getItem(
          STORAGE_KEY
        );

      if (savedCart) {
        const parsedCart = JSON.parse(
          savedCart
        );

        setItems(
          normalizeStoredCart(parsedCart)
        );
      }
    } catch (error) {
      console.error(
        "تعذر تحميل سلة زاد:",
        error
      );

      window.localStorage.removeItem(
        STORAGE_KEY
      );
    } finally {
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!isLoaded) return;

    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(items)
      );
    } catch (error) {
      console.error(
        "تعذر حفظ سلة زاد:",
        error
      );
    }
  }, [items, isLoaded]);

  const openCart = () => {
    setIsCartOpen(true);
  };

  const closeCart = () => {
    setIsCartOpen(false);
  };

  const toggleCart = () => {
    setIsCartOpen(
      (previous) => !previous
    );
  };

  const addItem = (
    product: CartProduct,
    quantity = 1
  ) => {
    const safeQuantity = Math.max(
      1,
      Math.floor(quantity)
    );

    const normalizedProduct =
      normalizeCartProduct(product);

    setItems((previousItems) => {
      const existingItem =
        previousItems.find(
          (item) =>
            item.id ===
              normalizedProduct.id &&
            item.size ===
              normalizedProduct.size
        );

      if (existingItem) {
        return previousItems.map((item) =>
          item.id ===
            normalizedProduct.id &&
          item.size ===
            normalizedProduct.size
            ? {
                ...item,
                ...normalizedProduct,
                quantity:
                  item.quantity +
                  safeQuantity,
              }
            : item
        );
      }

      return [
        ...previousItems,
        {
          ...normalizedProduct,
          quantity: safeQuantity,
        },
      ];
    });

    setIsCartOpen(true);
  };

  const increaseQuantity = (
    id: string
  ) => {
    setItems((previousItems) =>
      previousItems.map((item) =>
        item.id === id
          ? {
              ...item,
              quantity:
                item.quantity + 1,
            }
          : item
      )
    );
  };

  const decreaseQuantity = (
    id: string
  ) => {
    setItems((previousItems) =>
      previousItems
        .map((item) =>
          item.id === id
            ? {
                ...item,
                quantity:
                  item.quantity - 1,
              }
            : item
        )
        .filter(
          (item) => item.quantity > 0
        )
    );
  };

  const removeItem = (
    id: string
  ) => {
    setItems((previousItems) =>
      previousItems.filter(
        (item) => item.id !== id
      )
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const totalItems = useMemo(() => {
    return items.reduce(
      (total, item) =>
        total + item.quantity,
      0
    );
  }, [items]);

  const originalSubtotal = useMemo(() => {
    return items.reduce(
      (total, item) => {
        const originalPrice = Math.max(
          Number(item.price),
          Number(
            item.originalPrice ??
              item.price
          )
        );

        return (
          total +
          originalPrice *
            item.quantity
        );
      },
      0
    );
  }, [items]);

  const subtotal = useMemo(() => {
    return items.reduce(
      (total, item) =>
        total +
        Number(item.price) *
          item.quantity,
      0
    );
  }, [items]);

  const offerDiscount = useMemo(() => {
    return Math.max(
      0,
      originalSubtotal - subtotal
    );
  }, [
    originalSubtotal,
    subtotal,
  ]);

  const value: CartContextType = {
    items,
    isCartOpen,
    openCart,
    closeCart,
    toggleCart,
    addItem,
    increaseQuantity,
    decreaseQuantity,
    removeItem,
    clearCart,
    totalItems,
    originalSubtotal,
    offerDiscount,
    subtotal,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(
    CartContext
  );

  if (!context) {
    throw new Error(
      "useCart يجب أن يُستخدم داخل CartProvider"
    );
  }

  return context;
}