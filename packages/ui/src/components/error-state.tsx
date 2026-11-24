"use client";

import * as React from "react";
import { AlertTriangle, RotateCw } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "../lib/cn";
import { Button } from "./button";

export interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => unknown;
  retrying?: boolean;
  className?: string;
}

export function ErrorState({ title, description, onRetry, retrying, className }: ErrorStateProps) {
  const t = useTranslations("ui");
  return (
    <div
      role="alert"
      className={cn(
        "border-destructive/30 bg-destructive/5 flex flex-col items-center justify-center gap-3 rounded-lg border px-6 py-14 text-center",
        className,
      )}
    >
      <div className="bg-destructive/10 text-destructive flex size-12 items-center justify-center rounded-full">
        <AlertTriangle className="size-6" aria-hidden />
      </div>
      <div className="max-w-sm space-y-1">
        <h3 className="text-base font-semibold">{title ?? t("error.title")}</h3>
        <p className="text-muted-foreground text-sm">{description ?? t("error.description")}</p>
      </div>
      {onRetry ? (
        <Button
          variant="outline"
          className="mt-2"
          onClick={() => void onRetry()}
          loading={retrying}
        >
          {retrying ? null : <RotateCw aria-hidden />}
          {t("retry")}
        </Button>
      ) : null}
    </div>
  );
}
