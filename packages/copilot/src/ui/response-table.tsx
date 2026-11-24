"use client";

import * as React from "react";
import { Download } from "lucide-react";
import type { TableColumn, TableRow as RowData } from "../types";
import { Button } from "@repo/ui/components/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@repo/ui/components/table";
import { useMsg } from "@repo/ui/hooks/use-msg";
import { Quote } from "./quote";

const PREVIEW_ROWS = 6;

const toCsv = (columns: TableColumn[], rows: RowData[]) =>
  [
    columns.map((c) => `"${c.label.replaceAll('"', '""')}"`).join(","),
    ...rows.map((r: RowData) => columns.map((c) => `"${String(r[c.key] ?? "").replaceAll('"', '""')}"`).join(",")),
  ].join("\n");

const downloadCsv = (name: string, columns: TableColumn[], rows: RowData[]) => {
  // \uFEFF BOM keeps Excel on UTF-8 for Arabic cells
  const blob = new Blob(["\uFEFF" + toCsv(columns, rows)], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${name}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

export function ResponseTable({
  title,
  columns,
  rows,
}: {
  title?: string;
  columns: TableColumn[];
  rows: RowData[];
}) {
  const strictT = useMsg();
  const t = strictT as unknown as (key: string, params?: Record<string, string | number>) => string;
  const [expanded, setExpanded] = React.useState(false);
  const shown = expanded ? rows : rows.slice(0, PREVIEW_ROWS);

  return (
    <Quote className="space-y-2 p-0 pt-0">
      {title ? <p className="px-3 pt-2 text-xs font-semibold">{title}</p> : null}
      <div className="overflow-x-auto px-3">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((c) => (
                <TableHead key={c.key}>{c.label}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {shown.map((row, i) => (
              <TableRow key={i}>
                {columns.map((c) => (
                  <TableCell key={c.key} className="num whitespace-nowrap">
                    {row[c.key] ?? "—"}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center gap-2 px-3 pb-2">
        {rows.length > PREVIEW_ROWS ? (
          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setExpanded((v) => !v)}>
            {expanded ? t("copilot.showLess") : t("copilot.showAll", { count: rows.length })}
          </Button>
        ) : null}
        <Button
          variant="ghost"
          size="sm"
          className="ms-auto h-7 gap-1.5 text-xs"
          onClick={() => downloadCsv("copilot", columns, rows)}
        >
          <Download className="size-3.5" aria-hidden />
          {t("copilot.export")}
        </Button>
      </div>
    </Quote>
  );
}
