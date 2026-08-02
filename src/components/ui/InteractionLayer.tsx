"use client";

import { useEffect } from "react";
import { installSpecularTracking } from "./motion";

/**
 * Document-level interaction polish. Renders nothing.
 *
 * This exists so that effects which want a listener on the document — rather
 * than one per element — have a single place to live, mounted once from the
 * root layout. Right now that is the specular highlight that follows the
 * pointer across foil buttons; anything else that is genuinely global belongs
 * here too rather than becoming a second stray listener somewhere.
 */
export function InteractionLayer() {
  useEffect(() => installSpecularTracking(), []);
  return null;
}

export default InteractionLayer;
