"use client";

import * as React from "react";
import { DirectionProvider } from "@radix-ui/react-direction";
import { ThemeProvider } from "next-themes";
import { TooltipProvider } from "./tooltip";
import { Toaster } from "./toaster";
import { installZodMsgErrorMap } from "../lib/zod-error-map";

installZodMsgErrorMap();

export interface UIProvidersProps {
  dir: "rtl" | "ltr";
  /** Panels support dark mode; the storefront follows the tenant theme only. */
  enableDarkMode?: boolean;
  children: React.ReactNode;
}

export function UIProviders({ dir, enableDarkMode = true, children }: UIProvidersProps) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme={enableDarkMode ? "system" : "light"}
      forcedTheme={enableDarkMode ? undefined : "light"}
      enableSystem={enableDarkMode}
      disableTransitionOnChange
    >
      <DirectionProvider dir={dir}>
        <TooltipProvider delayDuration={300}>
          {children}
          <Toaster dir={dir} />
        </TooltipProvider>
      </DirectionProvider>
    </ThemeProvider>
  );
}
