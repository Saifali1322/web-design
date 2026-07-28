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
import { DELIVERY } from "@/lib/catalogue";
import type { BlendComponent } from "@/lib/blend";
import {
  blendLine,
  clampQuantity,
  lineKey,
  parseStoredCart,
  resolveLine,
  serialiseCart,
  LEGACY_STORAGE_KEY,
  STORAGE_KEY,
  type CartItem,
  type CartLine,
} from "@/components/cart/cartModel";

// Re-exported so consumers only ever import the cart from one place.
export { MAX_LINE_QUANTITY } from "@/components/cart/cartModel";
export type { CartItem, CartLine } from "@/components/cart/cartModel";

interface CartState {
  lines: CartLine[];
}

type CartAction =
  | { type: "add"; productId: string; quantity?: number }
  | { type: "addBlend"; line: CartLine }
  | { type: "remove"; key: string }
  | { type: "setQuantity"; key: string; quantity: number }
  | { type: "clear" }
  | { type: "hydrate"; lines: CartLine[] };

/** Adds a line, or tops up the matching one. Merging is by {@link lineKey}. */
function upsert(lines: CartLine[], incoming: CartLine): CartLine[] {
  const key = lineKey(incoming);
  const existing = lines.find((l) => lineKey(l) === key);
  if (!existing) return [...lines, incoming];

  return lines.map((l) =>
    lineKey(l) === key
      ? // The stored name wins on a merge: the composition is identical, so
        // renaming somebody's existing basket line from under them would be
        // the surprising outcome, not the helpful one.
        { ...l, quantity: clampQuantity(l.quantity + incoming.quantity) }
      : l,
  );
}

function reducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "hydrate":
      return { lines: action.lines };
    case "add":
      return {
        lines: upsert(state.lines, {
          kind: "product",
          productId: action.productId,
          quantity: clampQuantity(action.quantity ?? 1),
        }),
      };
    case "addBlend":
      return { lines: upsert(state.lines, action.line) };
    case "remove":
      return { lines: state.lines.filter((l) => lineKey(l) !== action.key) };
    case "setQuantity": {
      if (action.quantity <= 0) {
        return { lines: state.lines.filter((l) => lineKey(l) !== action.key) };
      }
      return {
        lines: state.lines.map((l) =>
          lineKey(l) === action.key
            ? { ...l, quantity: clampQuantity(action.quantity) }
            : l,
        ),
      };
    }
    case "clear":
      return { lines: [] };
  }
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
  /** Adds a custom blend. Returns false if the mix broke the rules. */
  addBlend: (
    components: ReadonlyArray<BlendComponent>,
    name: string,
    quantity?: number,
  ) => boolean;
  /** `key` comes from the item, not the product id — blends have no product. */
  remove: (key: string) => void;
  setQuantity: (key: string, quantity: number) => void;
  clear: () => void;
  openCart: () => void;
  closeCart: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, { lines: [] });
  const [isOpen, setIsOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // Restore a basket left behind on a previous visit, including one saved by
  // the pre-blend v1 build — parseStoredCart reads either shape.
  useEffect(() => {
    try {
      const current = localStorage.getItem(STORAGE_KEY);
      if (current) {
        dispatch({ type: "hydrate", lines: parseStoredCart(current) });
      } else {
        const legacy = localStorage.getItem(LEGACY_STORAGE_KEY);
        if (legacy) {
          dispatch({ type: "hydrate", lines: parseStoredCart(legacy) });
          // The persist effect below writes v2 on the next tick; drop v1 so a
          // later visit can't resurrect a stale copy over the live basket.
          localStorage.removeItem(LEGACY_STORAGE_KEY);
        }
      }
    } catch {
      // A corrupt or blocked basket is not worth surfacing — start empty.
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, serialiseCart(state.lines));
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
      const item = resolveLine(line);
      return item ? [item] : [];
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
      addBlend: (components, name, quantity) => {
        const line = blendLine(components, name, quantity);
        if (!line) return false;
        dispatch({ type: "addBlend", line });
        setIsOpen(true);
        return true;
      },
      remove: (key) => dispatch({ type: "remove", key }),
      setQuantity: (key, quantity) =>
        dispatch({ type: "setQuantity", key, quantity }),
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
