"use client";

import * as React from "react";
import { ExternalLink, Plus, Store, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCreateTestStore, useDeleteTestStore, useTestStores } from "@repo/api-client";
import { Button } from "@repo/ui/components/button";
import { Card } from "@repo/ui/components/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@repo/ui/components/dialog";
import { EmptyState } from "@repo/ui/components/empty-state";
import { ErrorState } from "@repo/ui/components/error-state";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import { PageHeader } from "@repo/ui/components/page-header";
import { Skeleton } from "@repo/ui/components/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@repo/ui/components/table";
import { toast } from "@repo/ui/components/toaster";
import { useAppLocale } from "@repo/ui/hooks/use-app-locale";
import { formatDate } from "@repo/ui/lib/format";

function NewStoreDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const t = useTranslations();
  const create = useCreateTestStore();
  const [name, setName] = React.useState("");
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("testStores.new")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-1.5">
          <Label htmlFor="store-name">{t("testStores.name")}</Label>
          <Input id="store-name" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button
            disabled={!name.trim()}
            loading={create.isPending}
            onClick={() =>
              create.mutate(name.trim(), { onSuccess: () => { toast.success(t("testStores.createdDone")); setName(""); onClose(); } })
            }
          >
            {t("testStores.create")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function TestStoresView() {
  const t = useTranslations();
  const { locale } = useAppLocale();
  const stores = useTestStores();
  const remove = useDeleteTestStore();
  const [creating, setCreating] = React.useState(false);
  const rows = stores.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("testStores.title")}
        description={t("testStores.description")}
        actions={
          <Button onClick={() => setCreating(true)}>
            <Plus aria-hidden />
            {t("testStores.new")}
          </Button>
        }
      />
      {stores.isError ? (
        <ErrorState title={t("common.error")} onRetry={() => void stores.refetch()} />
      ) : stores.isPending ? (
        <Skeleton className="h-64" />
      ) : rows.length === 0 ? (
        <EmptyState icon={Store} title={t("testStores.empty")} description={t("testStores.emptyText")} />
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("testStores.name")}</TableHead>
                <TableHead>{t("testStores.url")}</TableHead>
                <TableHead>{t("testStores.created")}</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell>
                    <span className="text-muted-foreground" dir="ltr">
                      {s.url}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(s.createdAt, locale)}</TableCell>
                  <TableCell>
                    <span className="flex justify-end gap-1">
                      <Button variant="ghost" size="sm" asChild>
                        <a href={s.url} target="_blank" rel="noreferrer">
                          <ExternalLink aria-hidden />
                          {t("testStores.open")}
                        </a>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive"
                        onClick={() => remove.mutate(s.id, { onSuccess: () => toast.success(t("testStores.deleted")) })}
                      >
                        <Trash2 aria-hidden />
                        {t("testStores.delete")}
                      </Button>
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
      <NewStoreDialog open={creating} onClose={() => setCreating(false)} />
    </div>
  );
}
