"use client";

/**
 * One "add to basket" gesture, shared by every button that performs it.
 *
 * There are three of them — the catalogue card (menu grid and homepage
 * bestsellers), the mixer's desktop panel and the mixer's phone bar — and the
 * timing between the flight, the add and the drawer is the sort of thing that
 * drifts apart immediately if each one wires it up for itself.
 *
 * The order matters and is the whole point of this file: the bottle is
 * launched first so it measures the button before anything can move under it,
 * the line goes into the basket in the same tick (so the count is correct
 * whatever happens next), and the drawer is told to wait until the bottle has
 * landed. Every one of those steps still works if the flight declines to run —
 * `flyToBasket` returns 0 and the drawer opens exactly as it always did.
 */

import { useCallback } from "react";
import type { BlendComponent } from "@/lib/blend";
import { flyToBasket, type FlightColours } from "@/components/ui/flyToBasket";
import { useCart } from "./CartProvider";

export function useAddToBasket() {
  const { add, addBlend } = useCart();

  /** @param origin the control that was pressed — the flight starts on it. */
  const addProduct = useCallback(
    (
      origin: Element | null | undefined,
      productId: string,
      colours: FlightColours,
      quantity?: number,
    ) => {
      add(productId, quantity, {
        openAfterMs: flyToBasket(origin, colours),
      });
    },
    [add],
  );

  const addCustomBlend = useCallback(
    (
      origin: Element | null | undefined,
      components: ReadonlyArray<BlendComponent>,
      name: string,
      colours: FlightColours,
    ): boolean =>
      addBlend(components, name, undefined, {
        openAfterMs: flyToBasket(origin, colours),
      }),
    [addBlend],
  );

  return { addProduct, addCustomBlend };
}
