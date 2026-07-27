"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
  type ReactNode,
} from "react";
import { DELIVERY, getProduct, type Product } from "@/lib/catalogue";

export interface CartLine {
  productId: string;
  quantity: number;
}

interface CartState {
  lines: CartLine[];
}

type CartAction =
  | { type: "add"; productId: string; quantity?: number }
  | { type: "remove"; productId: string }
  | { type: "setQuantity"; productId: string; quantity: number }
  | { type: "clear" }
  | { type: "hydrate"; lines: CartLine[] };

const STORAGE_KEY = "jc.cart.v1";

function reducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "hydrate":
      return { lines: action.lines };
    case "add": {
      const qty = action.quantity ?? 1;
      const existing = state.lines.find((l) => l.productId === action.productId);
      if (existing) {
        return {
          lines: state.lines.map((l) =>
            l.productId === action.productId
              ? { ...l, quantity: Math.min(l.quantity + qty, 99) }
              : l,
          ),
        };
      }
      return {
        lines: [...state.lines, { productId: action.productId, quantity: qty }],
      };
    }
    case "remove":
      return {
        lines: state.lines.filter((l) => l.productId !== action.productId),
      };
    case "setQuantity": {
      if (action.quantity <= 0) {
        return {
          lines: state.lines.filter((l) => l.productId !== action.productId),
        };
      }
      return {
        lines: state.lines.map((l) =>
          l.productId === action.productId
            ? { ...l, quantity: Math.min(action.quantity, 99) }
            : l,
        ),
      };
    }
    case "clear":
      return { lines: [] };
  }
}

export interface CartItem extends CartLine {
  product: Product;
  lineTotal: number;
}

interface CartContextValue {
  items: CartItem[];
  count: number;
  subtotal: number;
  deliveryFee: number;
  total: number;
  /** Basket is under the minimum order value, so checkout is blocked. */
  belowMinimum: boolean;
  /** How much more is needed to clear the minimum, in pence. */
  amountToMinimum: number;
  /** How much more is needed for free delivery, in pence. 0 once earned. */
  amountToFreeDelivery: number;
  isOpen: boolean;
  add: (productId: string, quantity?: number) => void;
  remove: (productId: string) => void;
  setQuantity: (productId: string, quantity: number) => void;
  clear: () => void;
  openCart: () => void;
  closeCart: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, { lines: [] });
  const [isOpen, setIsOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // Restore a basket left behind on a previous visit.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: unknown = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          const lines = parsed.filter(
            (l): l is CartLine =>
              typeof l === "object" &&
              l !== null &&
              typeof (l as CartLine).productId === "string" &&
              typeof (l as CartLine).quantity === "number" &&
              // Drop anything no longer on the menu.
              Boolean(getProduct((l as CartLine).productId)),
          );
          dispatch({ type: "hydrate", lines });
        }
      }
    } catch {
      // A corrupt basket is not worth surfacing — start empty.
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.lines));
    } catch {
      // Storage full or blocked; the basket still works for this session.
    }
  }, [state.lines, hydrated]);

  // Close the drawer on Escape.
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen]);

  // Stop the page scrolling behind an open drawer.
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const value = useMemo<CartContextValue>(() => {
    const items: CartItem[] = state.lines.flatMap((line) => {
      const product = getProduct(line.productId);
      if (!product) return [];
      return [{ ...line, product, lineTotal: product.price * line.quantity }];
    });

    const subtotal = items.reduce((sum, i) => sum + i.lineTotal, 0);
    const count = items.reduce((sum, i) => sum + i.quantity, 0);
    const earnedFreeDelivery = subtotal >= DELIVERY.freeDeliveryThreshold;
    const deliveryFee =
      subtotal === 0 || earnedFreeDelivery ? 0 : DELIVERY.deliveryFee;

    return {
      items,
      count,
      subtotal,
      deliveryFee,
      total: subtotal + deliveryFee,
      belowMinimum: subtotal > 0 && subtotal < DELIVERY.minimumOrder,
      amountToMinimum: Math.max(0, DELIVERY.minimumOrder - subtotal),
      amountToFreeDelivery: Math.max(
        0,
        DELIVERY.freeDeliveryThreshold - subtotal,
      ),
      isOpen,
      add: (productId, quantity) => {
        dispatch({ type: "add", productId, quantity });
        setIsOpen(true);
      },
      remove: (productId) => dispatch({ type: "remove", productId }),
      setQuantity: (productId, quantity) =>
        dispatch({ type: "setQuantity", productId, quantity }),
      clear: () => dispatch({ type: "clear" }),
      openCart: () => setIsOpen(true),
      closeCart: () => setIsOpen(false),
    };
  }, [state.lines, isOpen]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
