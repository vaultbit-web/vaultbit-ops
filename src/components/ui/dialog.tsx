"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "~/lib/utils";

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;

export function DialogContent({
  className,
  children,
  size = "md",
  ...props
}: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
  size?: "sm" | "md" | "lg";
}) {
  const sizeClass =
    size === "sm" ? "max-w-md" : size === "lg" ? "max-w-3xl" : "max-w-xl";
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay
        className="fixed inset-0 z-50 bg-anthracite-950/80 backdrop-blur-sm vb-anim-overlay"
      />
      <DialogPrimitive.Content
        className={cn(
          "fixed left-1/2 top-1/2 z-50 grid w-[calc(100vw-2rem)] sm:w-[95vw] -translate-x-1/2 -translate-y-1/2 gap-4",
          "card-dark p-4 sm:p-6 max-h-[85dvh] overflow-y-auto overscroll-contain",
          sizeClass,
          "vb-anim-pop",
          className,
        )}
        {...props}
      >
        {children}
        <DialogPrimitive.Close
          className="absolute right-4 top-4 rounded-md p-2 text-anthracite-200 transition-colors hover:bg-anthracite-700/50 hover:text-fg focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50"
          aria-label="Cerrar"
        >
          <X className="h-4 w-4" strokeWidth={1.5} />
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

export function DialogHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("flex flex-col gap-1.5 pr-8", className)} {...props} />
  );
}

export function DialogTitle({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      className={cn("text-lg font-semibold text-fg tracking-tight", className)}
      {...props}
    />
  );
}

export function DialogDescription({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      className={cn("text-sm text-anthracite-200", className)}
      {...props}
    />
  );
}

export function DialogFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-2 pt-2",
        className,
      )}
      {...props}
    />
  );
}
