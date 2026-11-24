"use client";

import * as React from "react";
import { Copy, Download, MoreVertical, Pencil, Trash2, Upload } from "lucide-react";
import { useTranslations } from "next-intl";
import { useDeleteTheme, useDuplicateTheme, useImportTheme, useRenameTheme } from "@repo/api-client";
import type { Theme } from "@repo/contracts";
import { Button } from "@repo/ui/components/button";
import { ConfirmDialog } from "@repo/ui/components/confirm-dialog";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@repo/ui/components/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@repo/ui/components/dropdown-menu";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import { useMsgToast } from "@repo/ui/components/msg-toast";
import { useMsg } from "@repo/ui/hooks/use-msg";
import { validateThemeImport, type ImportError } from "./theme-import";

type T = (key: string, params?: Record<string, string | number>) => string;

/** Download a theme as `<id>.theme.json`. */
const exportTheme = (theme: Theme) => {
  const blob = new Blob([JSON.stringify(theme, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${theme.id}.theme.json`;
  a.click();
  URL.revokeObjectURL(url);
};

function RenameDialog({ theme, open, onOpenChange }: { theme: Theme; open: boolean; onOpenChange: (v: boolean) => void }) {
  const t = useTranslations("storefront.themes") as unknown as T;
  const mt = useMsgToast();
  const rename = useRenameTheme();
  const [name, setName] = React.useState(theme.name);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("rename")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-1.5">
          <Label htmlFor="theme-name">{t("renameLabel")}</Label>
          <Input id="theme-name" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <DialogFooter>
          <Button
            onClick={() =>
              rename.mutate([theme.id, name.trim()], {
                onSuccess: () => {
                  mt.success("common.save.success");
                  onOpenChange(false);
                },
                onError: () => mt.error("common.save.error"),
              })
            }
            disabled={!name.trim() || rename.isPending}
            loading={rename.isPending}
          >
            {t("renameSave")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Per-theme "…" menu: duplicate, rename, export JSON, delete (draft-only). */
export function ThemeActionsMenu({ theme }: { theme: Theme }) {
  const t = useTranslations("storefront.themes") as unknown as T;
  const mt = useMsgToast();
  const duplicate = useDuplicateTheme();
  const remove = useDeleteTheme();
  const [renameOpen, setRenameOpen] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon-sm" aria-label={t("actions")}>
            <MoreVertical aria-hidden />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onSelect={() =>
              duplicate.mutate([theme.id], {
                onSuccess: () => mt.success("common.save.success"),
                onError: () => mt.error("common.save.error"),
              })
            }
          >
            <Copy aria-hidden />
            {t("duplicate")}
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setRenameOpen(true)}>
            <Pencil aria-hidden />
            {t("rename")}
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => exportTheme(theme)}>
            <Download aria-hidden />
            {t("export")}
          </DropdownMenuItem>
          {theme.status !== "published" ? (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => setDeleteOpen(true)} destructive>
                <Trash2 aria-hidden />
                {t("delete")}
              </DropdownMenuItem>
            </>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>
      <RenameDialog theme={theme} open={renameOpen} onOpenChange={setRenameOpen} />
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        titleKey="themes.delete.title"
        bodyKey="themes.delete.body"
        confirmKey="themes.delete.confirm"
        params={{ theme: theme.name }}
        danger
        pending={remove.isPending}
        onConfirm={() =>
          remove.mutate([theme.id], {
            onSuccess: () => {
              mt.success("common.deleted");
              setDeleteOpen(false);
            },
            onError: () => mt.error("common.save.error"),
          })
        }
      />
    </>
  );
}

/** Header "import JSON" button — file → validate → error list or create-as-draft. */
export function ImportThemeButton() {
  const t = useTranslations("storefront.themes") as unknown as T;
  const strictT = useMsg();
  const tm = strictT as unknown as T;
  const mt = useMsgToast();
  const importTheme = useImportTheme();
  const fileRef = React.useRef<HTMLInputElement>(null);
  const [errors, setErrors] = React.useState<ImportError[] | null>(null);

  const onFile = (file: File) => {
    file
      .text()
      .then((text) => {
        let payload: unknown;
        try {
          payload = JSON.parse(text);
        } catch {
          setErrors([{ key: "json" }]);
          return;
        }
        const { theme, errors: errs } = validateThemeImport(payload);
        if (errs.length || !theme) {
          setErrors(errs.length ? errs : [{ key: "shape" }]);
          return;
        }
        importTheme.mutate([theme], {
          onSuccess: () => mt.success("common.save.success"),
          onError: () => mt.error("common.save.error"),
        });
      })
      .catch(() => setErrors([{ key: "json" }]));
  };

  return (
    <>
      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
          e.target.value = "";
        }}
      />
      <Button variant="outline" onClick={() => fileRef.current?.click()} disabled={importTheme.isPending}>
        <Upload aria-hidden />
        {t("import")}
      </Button>
      <Dialog open={errors !== null} onOpenChange={(v) => !v && setErrors(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("importFailed")}</DialogTitle>
          </DialogHeader>
          <ul className="text-destructive list-disc space-y-1 ps-5 text-sm">
            {(errors ?? []).map((err, i) => (
              <li key={i}>{tm(`editor.import.errors.${err.key}`, err.params)}</li>
            ))}
          </ul>
          <DialogFooter>
            <Button variant="outline" onClick={() => setErrors(null)}>
              {t("close")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
