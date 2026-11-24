"use client";

import * as React from "react";
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type Column,
  type ColumnDef,
  type Row,
  type RowSelectionState,
  type SortingState,
} from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ChevronsUpDown, ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "../lib/cn";
import { formatNumber } from "../lib/format";
import { Button } from "./button";
import { Checkbox } from "./checkbox";
import { Skeleton } from "./skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./table";

export type { ColumnDef } from "@tanstack/react-table";

export interface DataTableProps<TData> {
  columns: ColumnDef<TData, unknown>[];
  data: TData[];
  getRowId?: (row: TData) => string;
  enableRowSelection?: boolean;
  /** Rendered above the table while rows are selected. */
  bulkActions?: (rows: TData[], clear: () => void) => React.ReactNode;
  toolbar?: React.ReactNode;
  pageSize?: number;
  onRowClick?: (row: TData) => void;
  emptyMessage?: string;
  className?: string;
}

function selectionColumn<TData>(labels: { all: string; row: string }): ColumnDef<TData, unknown> {
  return {
    id: "__select",
    enableSorting: false,
    header: ({ table }) => (
      <Checkbox
        aria-label={labels.all}
        checked={
          table.getIsAllPageRowsSelected()
            ? true
            : table.getIsSomePageRowsSelected()
              ? "indeterminate"
              : false
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(value === true)}
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        aria-label={labels.row}
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(value === true)}
        onClick={(event) => event.stopPropagation()}
      />
    ),
  };
}

export function DataTable<TData>({
  columns,
  data,
  getRowId,
  enableRowSelection = false,
  bulkActions,
  toolbar,
  pageSize = 10,
  onRowClick,
  emptyMessage,
  className,
}: DataTableProps<TData>) {
  const t = useTranslations("ui.table");
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});

  const allColumns = React.useMemo(
    () =>
      enableRowSelection
        ? [selectionColumn<TData>({ all: t("selectAll"), row: t("selectRow") }), ...columns]
        : columns,
    [columns, enableRowSelection, t],
  );

  const table = useReactTable({
    data,
    columns: allColumns,
    getRowId: getRowId ? (row: TData) => getRowId(row) : undefined,
    state: { sorting, rowSelection },
    enableRowSelection,
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize } },
  });

  const selected = table.getSelectedRowModel().rows.map((row: Row<TData>) => row.original);
  const { pageIndex } = table.getState().pagination;
  const pageCount = Math.max(table.getPageCount(), 1);

  return (
    <div className={cn("space-y-3", className)}>
      {toolbar}
      {bulkActions && selected.length > 0 ? (
        <div className="bg-accent/40 flex flex-wrap items-center gap-3 rounded-md border px-4 py-2 text-sm">
          <span className="font-medium">{t("selected", { count: selected.length })}</span>
          {bulkActions(selected, () => table.resetRowSelection())}
        </div>
      ) : null}
      <div className="bg-card overflow-hidden rounded-lg border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((group) => (
              <TableRow key={group.id} className="hover:bg-transparent">
                {group.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    aria-sort={
                      header.column.getIsSorted() === "asc"
                        ? "ascending"
                        : header.column.getIsSorted() === "desc"
                          ? "descending"
                          : undefined
                    }
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() ? "selected" : undefined}
                  className={cn(onRowClick && "cursor-pointer")}
                  onClick={onRowClick ? () => onRowClick(row.original) : undefined}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow className="hover:bg-transparent">
                <TableCell
                  colSpan={allColumns.length}
                  className="text-muted-foreground h-24 text-center"
                >
                  {emptyMessage ?? t("noResults")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {pageCount > 1 ? (
        <div className="flex items-center justify-between gap-2 text-sm">
          <span className="text-muted-foreground">
            {t("page", { page: formatNumber(pageIndex + 1), pages: formatNumber(pageCount) })}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronRight className="ltr:rotate-180" aria-hidden />
              {t("previous")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              {t("next")}
              <ChevronLeft className="ltr:rotate-180" aria-hidden />
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function DataTableColumnHeader<TData>({
  column,
  title,
}: {
  column: Column<TData, unknown>;
  title: string;
}) {
  if (!column.getCanSort()) return <span>{title}</span>;
  const sorted = column.getIsSorted();
  const Icon = sorted === "asc" ? ArrowUp : sorted === "desc" ? ArrowDown : ChevronsUpDown;
  return (
    <button
      type="button"
      className="hover:bg-accent hover:text-accent-foreground focus-visible:ring-ring -mx-2 inline-flex items-center gap-1 rounded px-2 py-1 focus-visible:outline-none focus-visible:ring-2"
      onClick={() => column.toggleSorting(sorted === "asc")}
    >
      {title}
      <Icon className="size-3.5" aria-hidden />
    </button>
  );
}

export function TableSkeleton({ rows = 6, columns = 5 }: { rows?: number; columns?: number }) {
  return (
    <div className="bg-card overflow-hidden rounded-lg border" aria-busy>
      <div className="bg-muted/50 border-b px-4 py-3">
        <Skeleton className="h-4 w-40" />
      </div>
      {Array.from({ length: rows }, (_, row) => (
        <div key={row} className="flex items-center gap-6 border-b px-4 py-4 last:border-0">
          {Array.from({ length: columns }, (_, col) => (
            <Skeleton key={col} className={cn("h-4", col === 0 ? "w-20" : "flex-1")} />
          ))}
        </div>
      ))}
    </div>
  );
}
