"use client";

import * as React from "react";
import { Check, ChevronLeft, FileUp, Play, Upload } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCreateImport, type ImportInput } from "@repo/api-client";
import type { ImportJob } from "@repo/contracts";
import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/card";
import { Checkbox } from "@repo/ui/components/checkbox";
import { Label } from "@repo/ui/components/label";
import { RadioGroup, RadioGroupItem } from "@repo/ui/components/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@repo/ui/components/table";
import { toast } from "@repo/ui/components/toaster";
import { useMsgToast } from "@repo/ui/components/msg-toast";
import { cn } from "@repo/ui/lib/cn";
import { useStoreRouter } from "@/lib/store-route";

const TYPES: ImportJob["type"][] = ["products", "customers", "inventory"];
const SOURCES: ImportJob["source"][] = ["file", "salla", "zid"];
const STEPS = ["type", "upload", "mapping", "preview", "options"] as const;
const MAPPING_FIELDS = ["name", "sku", "price", "stock", "phone", "email", "ignore"] as const;

const PREVIEW_ROWS = [
  { cells: ["قهوة سعودية فاخرة", "NK-IMP-001", "75.00", "30"], error: null },
  { cells: ["تمر خلاص 1كجم", "NK-IMP-002", "95.00", "12"], error: null },
  { cells: ["", "NK-IMP-003", "abc", "5"], error: "rowErrorNamePrice" },
  { cells: ["عطر مسك", "NK-IMP-004", "140.00", "8"], error: null },
] as const;

function Stepper({ step }: { step: number }) {
  const t = useTranslations("catalog.imports.steps");
  return (
    <ol className="flex flex-wrap items-center gap-1 text-sm">
      {STEPS.map((s, i) => (
        <li key={s} className="flex items-center gap-1">
          {i > 0 ? <ChevronLeft className="text-muted-foreground size-4 rtl:rotate-180" aria-hidden /> : null}
          <span className={cn("flex items-center gap-1.5 rounded-full px-2.5 py-1", i === step ? "bg-primary text-primary-foreground font-medium" : i < step ? "text-success" : "text-muted-foreground")}>
            {i < step ? <Check className="size-3.5" aria-hidden /> : <span className="num">{i + 1}</span>}
            {t(s)}
          </span>
        </li>
      ))}
    </ol>
  );
}

export function ImportWizard() {
  const t = useTranslations("catalog.imports");
  const tc = useTranslations("common");
  const router = useStoreRouter();
  const mt = useMsgToast();
  const create = useCreateImport();
  const [step, setStep] = React.useState(0);
  const [type, setType] = React.useState<ImportJob["type"]>("products");
  const [source, setSource] = React.useState<ImportJob["source"]>("file");
  const [fileName, setFileName] = React.useState("");
  const [mapping, setMapping] = React.useState<string[]>(["name", "sku", "price", "stock"]);
  const FIELD_LABELS: Record<string, string> = { name: t("fields.name"), sku: t("fields.sku"), price: t("fields.price"), stock: t("fields.stock"), phone: t("fields.phone"), email: t("fields.email"), ignore: t("fields.ignore") };
  const [updateExisting, setUpdateExisting] = React.useState(true);

  const start = () => {
    const input: ImportInput = { type, source, fileName: fileName || "products.csv", updateExisting };
    create.mutate([input], {
      onSuccess: (job) => { mt.success("imports.started"); router.push(`/imports/${job.id}`); },
      onError: () => toast.error(t("failed")),
    });
  };

  return (
    <Card>
      <CardHeader><CardTitle className="text-base">{t("newImport")}</CardTitle></CardHeader>
      <CardContent className="space-y-5">
        <Stepper step={step} />
        {step === 0 ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>{t("pickType")}</Label>
              <RadioGroup value={type} onValueChange={(v) => setType(v as ImportJob["type"])} className="space-y-1.5">
                {TYPES.map((k) => (
                  <Label key={k} className={cn("flex cursor-pointer items-center gap-2 rounded-md border p-3", type === k && "border-primary bg-primary/5")}>
                    <RadioGroupItem value={k} />{t(`types.${k}`)}
                  </Label>
                ))}
              </RadioGroup>
            </div>
            <div className="space-y-2">
              <Label>{t("pickSource")}</Label>
              <RadioGroup value={source} onValueChange={(v) => setSource(v as ImportJob["source"])} className="space-y-1.5">
                {SOURCES.map((k) => (
                  <Label key={k} className={cn("flex cursor-pointer items-center gap-2 rounded-md border p-3", source === k && "border-primary bg-primary/5")}>
                    <RadioGroupItem value={k} />{t(`sources.${k}`)}
                  </Label>
                ))}
              </RadioGroup>
            </div>
          </div>
        ) : null}
        {step === 1 ? (
          <div className="space-y-3">
            {source === "file" ? (
              <label className="border-muted-foreground/30 hover:border-primary flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-10 text-center">
                <FileUp className="text-muted-foreground size-8" aria-hidden />
                <span className="text-sm font-medium">{fileName || t("dropFile")}</span>
                <span className="text-muted-foreground text-xs">{t("fileTypes")}</span>
                <input type="file" accept=".csv,.xlsx" className="sr-only" onChange={(e) => setFileName(e.target.files?.[0]?.name ?? "")} />
              </label>
            ) : (
              <div className="rounded-lg border p-6 text-center">
                <Upload className="text-muted-foreground mx-auto size-8" aria-hidden />
                <p className="mt-2 text-sm font-medium">{t(`connectHint.${source}`)}</p>
                <Badge variant="secondary" className="mt-1">{t("simulation")}</Badge>
                <div><Button className="mt-3" variant="outline" onClick={() => setFileName(`${source}-export.csv`)}>{t(`connect.${source}`)}</Button></div>
                {fileName ? <p className="text-success mt-2 text-xs"><bdi dir="ltr">{fileName}</bdi></p> : null}
              </div>
            )}
          </div>
        ) : null}
        {step === 2 ? (
          <div className="space-y-3">
            <p className="text-muted-foreground text-sm">{t("mappingHint")}</p>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {["A", "B", "C", "D"].map((col, i) => (
                <div key={col} className="space-y-1.5 rounded-md border p-3">
                  <p className="text-muted-foreground text-xs">{t("column", { col })}</p>
                  <Select value={mapping[i] ?? "ignore"} onValueChange={(v) => setMapping(mapping.map((m, j) => (j === i ? v : m)))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{MAPPING_FIELDS.map((f) => <SelectItem key={f} value={f}>{t(`fields.${f}`)}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          </div>
        ) : null}
        {step === 3 ? (
          <div className="space-y-3">
            <p className="text-muted-foreground text-sm">{t("previewHint")}</p>
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>{["#", ...mapping.map((m) => FIELD_LABELS[m] ?? m), t("rowStatus")].map((h, i) => <TableHead key={i}>{h}</TableHead>)}</TableRow>
                </TableHeader>
                <TableBody>
                  {PREVIEW_ROWS.map((row, i) => (
                    <TableRow key={i} className={cn(row.error && "bg-destructive/5")}>
                      <TableCell className="num">{i + 1}</TableCell>
                      {row.cells.map((c, j) => <TableCell key={j} className="text-sm">{c || "—"}</TableCell>)}
                      <TableCell>{row.error ? <Badge variant="destructive">{t(row.error)}</Badge> : <Badge variant="success">{t("rowOk")}</Badge>}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <p className="text-muted-foreground text-xs">{t("previewNote")}</p>
          </div>
        ) : null}
        {step === 4 ? (
          <div className="space-y-3">
            <Label className="flex cursor-pointer items-start gap-2 rounded-md border p-3">
              <Checkbox checked={updateExisting} onCheckedChange={(v) => setUpdateExisting(v === true)} />
              <span>
                <span className="block text-sm font-medium">{t("updateExisting")}</span>
                <span className="text-muted-foreground block text-xs">{t("updateExistingHint")}</span>
              </span>
            </Label>
          </div>
        ) : null}
        <div className="flex justify-between">
          <Button variant="outline" disabled={step === 0} onClick={() => setStep(step - 1)}>{tc("back")}</Button>
          {step < STEPS.length - 1 ? (
            <Button onClick={() => setStep(step + 1)} disabled={step === 1 && !fileName}>{tc("next")}</Button>
          ) : (
            <Button onClick={start} disabled={create.isPending}><Play aria-hidden />{t("start")}</Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
