"use client";

import * as React from "react";
import { Braces, Copy, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useApiKeys, useCreateApiKey, useRevokeApiKey } from "@repo/api-client";
import { Button } from "@repo/ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/ui/components/card";
import { Checkbox } from "@repo/ui/components/checkbox";
import { ConfirmDialog } from "@repo/ui/components/confirm-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@repo/ui/components/dialog";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@repo/ui/components/table";
import { useMsgToast } from "@repo/ui/components/msg-toast";
import { useAppLocale } from "@repo/ui/hooks/use-app-locale";
import { formatDateTime } from "@repo/ui/lib/format";
import { toast } from "@repo/ui/components/toaster";

const SCOPES = ["orders.read", "orders.manage", "products.read", "customers.read", "invoices.read", "reports.read"] as const;
export function ApiKeysCard() {
  const t = useTranslations("settings");
  const mt = useMsgToast();
  const { locale } = useAppLocale();
  const { data } = useApiKeys();
  const create = useCreateApiKey();
  const revoke = useRevokeApiKey();
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [scopes, setScopes] = React.useState<Set<string>>(new Set());
  const [secret, setSecret] = React.useState<string | null>(null);
  const [revokeId, setRevokeId] = React.useState<{ id: string; name: string } | null>(null);
  const submit = () =>
    create.mutate(
      { name, scopes: [...scopes] },
      {
        onSuccess: (res) => {
          setSecret(res.secret);
          setOpen(false);
        },
      },
    );
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <div className="space-y-1">
          <CardTitle className="flex items-center gap-2 text-base">
            <Braces className="size-4" aria-hidden /> {t("developers.apiKeys.title")}
          </CardTitle>
          <CardDescription>{t("developers.apiKeys.hint")}</CardDescription>
        </div>
        <Button size="sm" onClick={() => setOpen(true)}>
          <Plus aria-hidden /> {t("developers.apiKeys.create")}
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("developers.cols.name")}</TableHead>
              <TableHead>{t("developers.cols.scopes")}</TableHead>
              <TableHead>{t("developers.cols.prefix")}</TableHead>
              <TableHead>{t("developers.cols.lastUsed")}</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {(data ?? []).map((k) => (
              <TableRow key={k.id}>
                <TableCell className="font-medium">{k.name}</TableCell>
                <TableCell>
                  <span className="flex flex-wrap gap-1">
                    {k.scopes.map((s) => (
                      <code key={s} dir="ltr" className="bg-muted rounded px-1.5 py-0.5 text-xs">
                        {s}
                      </code>
                    ))}
                  </span>
                </TableCell>
                <TableCell dir="ltr" className="num text-start">
                  {k.prefix}…
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">{k.lastUsedAt ? formatDateTime(new Date(k.lastUsedAt), locale) : "—"}</TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm" onClick={() => setRevokeId({ id: k.id, name: k.name })}>
                    {t("developers.revoke")}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("developers.apiKeys.create")}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="key-name">{t("developers.cols.name")}</Label>
                <Input id="key-name" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {SCOPES.map((s) => (
                  <Label key={s} className="flex items-center gap-2 text-sm font-normal" dir="ltr">
                    <Checkbox
                      checked={scopes.has(s)}
                      onCheckedChange={(v) =>
                        setScopes((all) => {
                          const next = new Set(all);
                          if (v) next.add(s);
                          else next.delete(s);
                          return next;
                        })
                      }
                    />
                    {s}
                  </Label>
                ))}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                {t("cancel")}
              </Button>
              <Button loading={create.isPending} disabled={!name.trim() || scopes.size === 0} onClick={submit}>
                {t("developers.apiKeys.create")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <Dialog open={secret !== null} onOpenChange={(o) => !o && setSecret(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{mt.text("developers.apiKey.created.title")}</DialogTitle>
              <DialogDescription>{mt.text("developers.apiKey.created.body")}</DialogDescription>
            </DialogHeader>
            <div className="bg-muted flex items-center gap-2 rounded-lg p-3">
              <code dir="ltr" className="flex-1 break-all text-xs">
                {secret}
              </code>
              <Button variant="ghost" size="icon" aria-label={mt.text("common.copy.success")} onClick={() => void navigator.clipboard?.writeText(secret ?? "").then(() => toast.success(mt.text("common.copy.success")))}>
                <Copy className="size-4" aria-hidden />
              </Button>
            </div>
            <DialogFooter>
              <Button onClick={() => setSecret(null)}>{mt.text("common.close")}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <ConfirmDialog
          open={revokeId !== null}
          onOpenChange={(o) => !o && setRevokeId(null)}
          titleKey="developers.apiKey.revoke.title"
          bodyKey="developers.apiKey.revoke.body"
          params={{ name: revokeId?.name ?? "" }}
          danger
          onConfirm={() => {
            if (revokeId) revoke.mutate([revokeId.id], { onSuccess: () => mt.success("common.deleted") });
            setRevokeId(null);
          }}
        />
      </CardContent>
    </Card>
  );
}

