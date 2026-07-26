"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from "react";

import type { CartItem, CartProduct } from "@/types/cart";

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

  increaseQuantity: (
    id: string
  ) => void;

  decreaseQuantity: (
    id: string
  ) => void;

  removeItem: (
    id: string
  ) => void;

  clearCart: () => void;

  totalItems: number;

  subtotal: number;
};

const CartContext =
  createContext<CartContextType | null>(
    null
  );

const STORAGE_KEY =
  "zad-kitchen-cart";

type CartProviderProps = {
  children: ReactNode;
};
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
        const parsedCart =
          JSON.parse(savedCart);

        if (Array.isArray(parsedCart)) {
          setItems(parsedCart);
        }
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
    setIsCartOpen((previous) => !previous);
  };
  const addItem = (
    product: CartProduct,
    quantity = 1
  ) => {
    const safeQuantity = Math.max(
      1,
      Math.floor(quantity)
    );

    setItems((previousItems) => {
      const existingItem =
        previousItems.find(
          (item) => item.id === product.id
        );

      if (existingItem) {
        return previousItems.map((item) =>
          item.id === product.id
            ? {
                ...item,
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
          ...product,
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

  const subtotal = useMemo(() => {
    return items.reduce(
      (total, item) =>
        total +
        item.price * item.quantity,
      0
    );
  }, [items]);
  const value = {
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
    subtotal,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(
      "useCart يجب أن يُستخدم داخل CartProvider"
    );
  }

  return context;
}