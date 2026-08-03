"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
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

/** A line lifted out of the basket, kept just long enough to put it back. */
interface RemovedLine {
  line: CartLine;
  /** Where it was, so undo restores the order as well as the contents. */
  index: number;
  /** Distinguishes two removals of the same line for the undo banner's timer. */
  at: number;
}

interface CartState {
  lines: CartLine[];
  /** Most recent removal, or null. Cleared by anything that isn't an undo. */
  removed: RemovedLine | null;
}

type CartAction =
  | { type: "add"; productId: string; quantity?: number }
  | { type: "addBlend"; line: CartLine }
  | { type: "remove"; key: string }
  | { type: "setQuantity"; key: string; quantity: number }
  | { type: "undo" }
  | { type: "dismissUndo" }
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

/** Lifts a line out and remembers where it was, so `undo` can put it back. */
function lift(state: CartState, key: string): CartState {
  const index = state.lines.findIndex((l) => lineKey(l) === key);
  if (index === -1) return state;
  return {
    lines: state.lines.filter((_, i) => i !== index),
    removed: { line: state.lines[index], index, at: Date.now() },
  };
}

function reducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "hydrate":
      return { lines: action.lines, removed: null };
    case "add":
      return {
        lines: upsert(state.lines, {
          kind: "product",
          productId: action.productId,
          quantity: clampQuantity(action.quantity ?? 1),
        }),
        removed: null,
      };
    case "addBlend":
      return { lines: upsert(state.lines, action.line), removed: null };
    case "remove":
      return lift(state, action.key);
    case "setQuantity": {
      // Stepping the last one off a line is a removal like any other, so it
      // gets the same undo — that down-arrow is the easiest slip in the drawer.
      if (action.quantity <= 0) return lift(state, action.key);
      return {
        lines: state.lines.map((l) =>
          lineKey(l) === action.key
            ? { ...l, quantity: clampQuantity(action.quantity) }
            : l,
        ),
        removed: null,
      };
    }
    case "undo": {
      if (!state.removed) return state;
      const { line, index } = state.removed;
      const lines = [...state.lines];
      lines.splice(Math.min(index, lines.length), 0, line);
      return { lines, removed: null };
    }
    case "dismissUndo":
      return state.removed ? { ...state, removed: null } : state;
    case "clear":
      return { lines: [], removed: null };
  }
}

export interface AddOptions {
  /**
   * Hold the drawer back this many milliseconds. The line is added to the
   * basket immediately either way — this only delays the slide-over, so that
   * the fly-to-basket bottle can land on a header the drawer would otherwise
   * have covered before it got there. Omit, or 0, to open at once.
   */
  openAfterMs?: number;
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
  /** Delivery saved by clearing the threshold, in pence. 0 until it is. */
  deliverySaved: number;
  /** False until localStorage has been read, so nothing flashes empty first. */
  hydrated: boolean;
  /** The last line taken out, still restorable. Null once undone or replaced. */
  lastRemoved: CartItem | null;
  isOpen: boolean;
  add: (productId: string, quantity?: number, options?: AddOptions) => void;
  /** Adds a custom blend. Returns false if the mix broke the rules. */
  addBlend: (
    components: ReadonlyArray<BlendComponent>,
    name: string,
    quantity?: number,
    options?: AddOptions,
  ) => boolean;
  /** `key` comes from the item, not the product id — blends have no product. */
  remove: (key: string) => void;
  setQuantity: (key: string, quantity: number) => void;
  /** Puts the last removed line back where it was. */
  undoRemove: () => void;
  /** Drops the undo offer without restoring anything. */
  dismissUndo: () => void;
  clear: () => void;
  openCart: () => void;
  closeCart: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, { lines: [], removed: null });
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

  /* Opening the drawer is the one thing an add is allowed to defer, so the
     bottle thrown at the basket by `flyToBasket` can land on a header that is
     still visible. One timer, replaced rather than stacked: three quick adds
     should open the drawer once, after the last bottle lands. */
  const openTimer = useRef<number | null>(null);
  const revealCart = useCallback((delay: number) => {
    if (openTimer.current !== null) window.clearTimeout(openTimer.current);
    if (!(delay > 0)) {
      openTimer.current = null;
      setIsOpen(true);
      return;
    }
    openTimer.current = window.setTimeout(() => {
      openTimer.current = null;
      setIsOpen(true);
    }, delay);
  }, []);

  // A pending open must not survive the provider — it would slide a drawer in
  // over whatever came next.
  useEffect(
    () => () => {
      if (openTimer.current !== null) window.clearTimeout(openTimer.current);
    },
    [],
  );

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
      deliverySaved: earnedFreeDelivery ? DELIVERY.deliveryFee : 0,
      hydrated,
      // Resolved here rather than in the reducer so an undo offer for a line
      // that has since left the catalogue simply doesn't appear.
      lastRemoved: state.removed ? resolveLine(state.removed.line) : null,
      isOpen,
      add: (productId, quantity, options) => {
        dispatch({ type: "add", productId, quantity });
        revealCart(options?.openAfterMs ?? 0);
      },
      addBlend: (components, name, quantity, options) => {
        const line = blendLine(components, name, quantity);
        if (!line) return false;
        dispatch({ type: "addBlend", line });
        revealCart(options?.openAfterMs ?? 0);
        return true;
      },
      remove: (key) => dispatch({ type: "remove", key }),
      setQuantity: (key, quantity) =>
        dispatch({ type: "setQuantity", key, quantity }),
      undoRemove: () => dispatch({ type: "undo" }),
      dismissUndo: () => dispatch({ type: "dismissUndo" }),
      clear: () => dispatch({ type: "clear" }),
      openCart: () => setIsOpen(true),
      closeCart: () => setIsOpen(false),
    };
  }, [state.lines, state.removed, hydrated, isOpen, revealCart]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
