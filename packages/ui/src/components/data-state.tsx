"use client";

import * as React from "react";
import { ErrorState } from "./error-state";

/** Structurally compatible with TanStack Query's `UseQueryResult`. */
export interface AsyncState<T> {
  status: "pending" | "error" | "success";
  data: T | undefined;
  error?: unknown;
  isRefetching?: boolean;
  refetch?: () => unknown;
}

export interface DataStateProps<T> {
  state: AsyncState<T>;
  loading: React.ReactNode;
  empty?: React.ReactNode;
  isEmpty?: (data: T) => boolean;
  error?: (retry: (() => unknown) | undefined) => React.ReactNode;
  children: (data: T) => React.ReactNode;
}

/** Renders exactly one of the four screen states: loading, error, empty, data. */
export function DataState<T>({
  state,
  loading,
  empty,
  isEmpty,
  error,
  children,
}: DataStateProps<T>) {
  if (state.status === "pending") return <>{loading}</>;
  if (state.status === "error" || state.data === undefined) {
    return (
      <>
        {error ? (
          error(state.refetch)
        ) : (
          <ErrorState onRetry={state.refetch} retrying={state.isRefetching} />
        )}
      </>
    );
  }
  if (empty && isEmpty?.(state.data)) return <>{empty}</>;
  return <>{children(state.data)}</>;
}
