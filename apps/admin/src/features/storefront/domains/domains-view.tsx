"use client";

import * as React from "react";
import { Copy, Globe, Plus, RefreshCw, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useAddDomain, useDomains, useRemoveDomain, useSetPrimaryDomain, useVerifyDomain } from "@repo/api-client";
import type { Domain } from "@repo/contracts";
import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/card";
import { ConfirmDialog } from "@repo/ui/components/confirm-dialog";
import { DataState } from "@repo/ui/components/data-state";
import { Input } from "@repo/ui/components/input";
import { useMsgToast } from "@repo/ui/components/msg-toast";
import { PageHeader } from "@repo/ui/components/page-header";
import { Skeleton } from "@repo/ui/components/skeleton";
import { StatusBadge } from "@repo/ui/components/status-badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@repo/ui/components/table";

function copyText(value: string, copied: () => void) {
  void navigator.clipboard?.writeText(value).then(copied).catch(() => copied());
}

function DnsTable({ domain }: { domain: Domain }) {
  const t = useTranslations("storefront.domains.dns");
  const mt = useMsgToast();
  return (
    <div className="space-y-2">
      <div>
        <p className="text-sm font-medium">{t("title")}</p>
        <p className="text-muted-foreground text-xs">{t("hint")}</p>
      </div>
      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("type")}</TableHead>
              <TableHead>{t("name")}</TableHead>
              <TableHead>{t("value")}</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {domain.dnsRecords.map((r, i) => (
              <TableRow key={i}>
                <TableCell>
                  <Badge variant="secondary" className="font-mono font-normal">
                    {r.type}
                  </Badge>
                </TableCell>
                <TableCell dir="ltr" className="font-mono text-start text-xs">
                  {r.name}
                </TableCell>
                <TableCell dir="ltr" className="max-w-56 truncate font-mono text-start text-xs">
                  {r.value}
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    aria-label={t("value")}
                    onClick={() => copyText(r.value, () => mt.success("common.copy.success"))}
                  >
                    <Copy className="size-4" aria-hidden />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export function DomainsView() {
  const t = useTranslations("storefront.domains");
  const mt = useMsgToast();
  const domains = useDomains();
  const add = useAddDomain();
  const verify = useVerifyDomain();
  const setPrimary = useSetPrimaryDomain();
  const remove = useRemoveDomain();

  const [hostname, setHostname] = React.useState("");
  const [hostError, setHostError] = React.useState(false);
  const [primaryTarget, setPrimaryTarget] = React.useState<Domain | null>(null);
  const [removeTarget, setRemoveTarget] = React.useState<Domain | null>(null);

  const submitAdd = () => {
    const host = hostname.trim();
    if (!host) return;
    add.mutate([host], {
      onSuccess: (d) => {
        mt.success("domains.added", { domain: d.hostname });
        mt.info("domains.verifying");
        setHostname("");
        setHostError(false);
      },
      onError: () => setHostError(true),
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader title={t("title")} description={t("description")} />
      <Card>
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Globe className="text-muted-foreground pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2" aria-hidden />
            <Input
              dir="ltr"
              className="ps-9 text-start"
              placeholder={t("placeholder")}
              value={hostname}
              aria-invalid={hostError}
              onChange={(e) => {
                setHostname(e.target.value);
                setHostError(false);
              }}
              onKeyDown={(e) => e.key === "Enter" && submitAdd()}
            />
          </div>
          <Button onClick={submitAdd} loading={add.isPending} disabled={!hostname.trim()}>
            <Plus aria-hidden />
            {t("add")}
          </Button>
        </CardContent>
        {hostError ? <p className="text-destructive px-4 pb-4 text-xs">{t("errors.hostname")}</p> : null}
        <p className="text-muted-foreground border-t px-4 py-2.5 text-xs">{t("simulated")}</p>
      </Card>
      <DataState
        state={domains}
        loading={
          <div className="grid gap-4 lg:grid-cols-2">
            <Skeleton className="h-48 rounded-xl" />
            <Skeleton className="h-48 rounded-xl" />
          </div>
        }
      >
        {(list) => (
          <div className="grid gap-4 lg:grid-cols-2">
            {list.map((d) => (
              <Card key={d.id}>
                <CardHeader className="flex-row items-center justify-between gap-2 space-y-0 pb-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <CardTitle dir="ltr" className="truncate text-base">
                      {d.hostname}
                    </CardTitle>
                    {d.isPrimary ? <Badge variant="default">{t("primary")}</Badge> : null}
                  </div>
                  <Badge variant="secondary" className="shrink-0 font-normal">
                    {t(`types.${d.type}`)}
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-muted-foreground text-xs">{t("status.verification")}</span>
                    <StatusBadge entity="domain" value={d.verificationStatus} />
                    <span className="text-muted-foreground ms-3 text-xs">{t("status.ssl")}</span>
                    <StatusBadge entity="domain" field="ssl" value={d.sslStatus} />
                  </div>
                  {d.type === "custom" && d.verificationStatus !== "verified" && d.dnsRecords.length ? <DnsTable domain={d} /> : null}
                  <div className="flex flex-wrap gap-2">
                    {d.type === "custom" && d.verificationStatus !== "verified" ? (
                      <Button
                        variant="outline"
                        size="sm"
                        loading={verify.isPending}
                        onClick={() => verify.mutate([d.id], { onSuccess: () => mt.info("domains.verifying") })}
                      >
                        <RefreshCw aria-hidden />
                        {t("verify")}
                      </Button>
                    ) : null}
                    {!d.isPrimary && d.verificationStatus === "verified" ? (
                      <Button variant="outline" size="sm" onClick={() => setPrimaryTarget(d)}>
                        {t("setPrimary")}
                      </Button>
                    ) : null}
                    {d.type === "custom" ? (
                      <Button variant="ghost" size="sm" className="text-destructive ms-auto" onClick={() => setRemoveTarget(d)}>
                        <Trash2 aria-hidden />
                        {t("remove")}
                      </Button>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </DataState>
      <ConfirmDialog
        open={primaryTarget !== null}
        onOpenChange={(v) => !v && setPrimaryTarget(null)}
        titleKey="domains.primary.title"
        bodyKey="domains.primary.body"
        confirmLabel={t("setPrimary")}
        params={{ domain: primaryTarget?.hostname ?? "" }}
        pending={setPrimary.isPending}
        onConfirm={() =>
          primaryTarget &&
          setPrimary.mutate([primaryTarget.id], {
            onSuccess: () => {
              mt.success("domains.primary.done", { domain: primaryTarget.hostname });
              setPrimaryTarget(null);
            },
          })
        }
      />
      <ConfirmDialog
        open={removeTarget !== null}
        onOpenChange={(v) => !v && setRemoveTarget(null)}
        titleKey="products.delete.title"
        confirmLabel={t("remove")}
        params={{ name: removeTarget?.hostname ?? "" }}
        danger
        pending={remove.isPending}
        onConfirm={() =>
          removeTarget &&
          remove.mutate([removeTarget.id], {
            onSuccess: () => {
              mt.success("domains.removed", { domain: removeTarget.hostname });
              setRemoveTarget(null);
            },
          })
        }
      />
    </div>
  );
}
