"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "~/lib/utils";

/**
 * Drawer lateral basado en Radix Dialog (mismas garantías de accesibilidad
 * y focus trap). Variante side="right" para ficha de partner; side="bottom"
 * disponible si en el futuro hace falta.
 */

export const Drawer = DialogPrimitive.Root;
export const DrawerTrigger = DialogPrimitive.Trigger;
export const DrawerClose = DialogPrimitive.Close;

interface DrawerContentProps
  extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
  /** "responsive": bottom-sheet en móvil/tablet, panel derecho en lg+ */
  side?: "right" | "bottom" | "responsive";
}

export function DrawerContent({
  className,
  children,
  side = "right",
  ...props
}: DrawerContentProps) {
  const sideClass =
    side === "right"
      ? "right-0 top-0 h-dvh w-full max-w-[560px] border-l border-anthracite-600/40 pt-[env(safe-area-inset-top)]"
      : side === "bottom"
        ? "bottom-0 left-0 right-0 max-h-[85dvh] w-full rounded-t-(--radius-xl) border-t border-anthracite-600/40"
        : "inset-x-0 bottom-0 max-h-[92dvh] w-full rounded-t-(--radius-xl) border-t border-anthracite-600/40 lg:inset-x-auto lg:bottom-auto lg:right-0 lg:top-0 lg:h-dvh lg:max-h-none lg:max-w-[560px] lg:rounded-none lg:border-t-0 lg:border-l lg:pt-[env(safe-area-inset-top)]";

  const animationClass =
    side === "right"
      ? "vb-anim-panel"
      : side === "bottom"
        ? "vb-anim-sheet"
        : "vb-anim-sheet lg:vb-anim-panel";

  // En bottom-sheet la X se ancla al borde superior del panel, no al notch
  const closeTopClass =
    side === "right"
      ? "top-[max(env(safe-area-inset-top),1rem)]"
      : side === "bottom"
        ? "top-4"
        : "top-4 lg:top-[max(env(safe-area-inset-top),1rem)]";

  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay
        className="fixed inset-0 z-50 bg-anthracite-950/80 backdrop-blur-sm vb-anim-overlay"
      />
      <DialogPrimitive.Content
        className={cn(
          "fixed z-50 flex flex-col bg-anthracite-900 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.7)] focus:outline-none",
          sideClass,
          animationClass,
          className,
        )}
        {...props}
      >
        {side === "responsive" ? (
          <div
            aria-hidden
            className="mx-auto mt-2.5 h-1 w-10 shrink-0 rounded-full bg-anthracite-600 lg:hidden"
          />
        ) : null}
        {children}
        <DialogPrimitive.Close
          className={cn(
            "absolute right-4 rounded-md p-2 text-anthracite-200 transition-colors hover:bg-anthracite-700/50 hover:text-fg focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50",
            closeTopClass,
          )}
          aria-label="Cerrar"
        >
          <X className="h-4 w-4" strokeWidth={1.5} />
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

export function DrawerHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "border-b border-anthracite-600/30 pl-4 pr-12 py-4 sm:pl-6 sm:py-5",
        className,
      )}
      {...props}
    />
  );
}

export function DrawerTitle({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      className={cn(
        "text-lg font-semibold text-fg tracking-tight",
        className,
      )}
      {...props}
    />
  );
}

export function DrawerDescription({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      className={cn("text-sm text-anthracite-200 mt-1", className)}
      {...props}
    />
  );
}

export function DrawerBody({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6 sm:py-5",
        className,
      )}
      {...props}
    />
  );
}

export function DrawerFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "border-t border-anthracite-600/30 px-4 sm:px-6 pt-4 pb-[max(env(safe-area-inset-bottom),1rem)] flex items-center justify-end gap-2",
        className,
      )}
      {...props}
    />
  );
}
