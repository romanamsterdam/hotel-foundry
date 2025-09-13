import React from "react";
import { Toaster as Sonner } from "sonner";

/** App-wide Toaster (shadcn-compatible via sonner) */
export function Toaster() {
  return <Sonner position="top-right" richColors closeButton />;
}