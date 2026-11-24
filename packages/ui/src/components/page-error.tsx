"use client";

import * as React from "react";
import { useMsg } from "../hooks/use-msg";
import { ErrorState } from "./error-state";

export interface PageErrorProps {
  /** Sub-key under `msg.errors.*` (e.g. "load", "404", "403", "500"). */
  errorKey?: string;
  params?: Record<string, string | number | Date>;
  onRetry?: () => unknown;
  retrying?: boolean;
  /** Optional extra action below the retry button (e.g. "go home"). */
  action?: React.ReactNode;
  className?: string;
}

/** Full-page error state resolving `msg.errors.<errorKey>.title/.body`. */
export function PageError({ errorKey = "load", params, onRetry, retrying, action, className }: PageErrorProps) {
  const strictT = useMsg();
  const t = strictT as unknown as (key: string, params?: Record<string, string | number | Date>) => string;
  return (
    <div className={className}>
      <ErrorState
        title={t(`errors.${errorKey}.title`, params)}
        description={t(`errors.${errorKey}.body`, params)}
        onRetry={onRetry}
        retrying={retrying}
      />
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  );
}
