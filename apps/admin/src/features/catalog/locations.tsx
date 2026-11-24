"use client";

import * as React from "react";
import { MapPin, Pencil, Plus, Star } from "lucide-react";
import { useTranslations } from "next-intl";
import { useLocations, useSaveLocation, useSetDefaultLocation, useSetLocationStatus } from "@repo/api-client";
import type { Location } from "@repo/contracts";
import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import { Card, CardContent } from "@repo/ui/components/card";
import { Checkbox } from "@repo/ui/components/checkbox";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@repo/ui/components/dialog";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import { PageHeader } from "@repo/ui/components/page-header";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@repo/ui/components/table";
import { toast } from "@repo/ui/components/toaster";
import { useMsgToast } from "@repo/ui/components/msg-toast";
import { useCan } from "@/lib/permissions";

type Draft = { id?: string; name: string; city: string; address: string; isDefault: boolean };

/** `/inventory/locations` — warehouse locations (spec §5.7 multi-warehouse). */
export function LocationsScreen() {
  const t = useTranslations("catalog.locations");
  const mt = useMsgToast();
  const canManage = useCan("inventory.manage");
  const locations = useLocations();
  const save = useSaveLocation();
  const setStatus = useSetLocationStatus();
  const setDefault = useSetDefaultLocation();
  const [draft, setDraft] = React.useState<Draft | null>(null);

  const openNew = () => setDraft({ name: "", city: "", address: "", isDefault: false });
  const openEdit = (l: Location) => setDraft({ id: l.id, name: l.name, city: l.city ?? "", address: l.address ?? "", isDefault: l.isDefault });

  const submit = () => {
    const d = draft;
    if (!d) return;
    if (!d.name.trim()) { toast.error(t("nameRequired")); return; }
    save.mutate([{ id: d.id, name: d.name.trim(), city: d.city.trim() || null, address: d.address.trim() || null, isDefault: d.isDefault }], {
      onSuccess: () => { mt.success("locations.saved"); setDraft(null); },
      onError: () => mt.error("common.save.error"),
    });
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title={t("title")}
        description={t("description")}
        actions={canManage ? <Button onClick={openNew}><Plus aria-hidden /> {t("new")}</Button> : undefined}
      />
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("cols.name")}</TableHead>
                <TableHead>{t("cols.city")}</TableHead>
                <TableHead>{t("cols.address")}</TableHead>
                <TableHead>{t("cols.status")}</TableHead>
                <TableHead className="w-40">{t("cols.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(locations.data ?? []).map((l) => (
                <TableRow key={l.id}>
                  <TableCell className="font-medium">
                    <span className="flex items-center gap-2">
                      <MapPin className="text-muted-foreground size-4" aria-hidden />
                      {l.name}
                      {l.isDefault ? <Badge variant="secondary" className="gap-1"><Star className="size-3" aria-hidden /> {t("default")}</Badge> : null}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{l.city ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{l.address ?? "—"}</TableCell>
                  <TableCell><Badge variant={l.status === "active" ? "success" : "secondary"}>{t(`status.${l.status}`)}</Badge></TableCell>
                  <TableCell>
                    {canManage ? (
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(l)}><Pencil className="size-3.5" aria-hidden /> {t("edit")}</Button>
                        {!l.isDefault && l.status === "active" ? (
                          <Button variant="ghost" size="sm" onClick={() => setDefault.mutate([l.id])}>{t("setDefault")}</Button>
                        ) : null}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setStatus.mutate([l.id, l.status === "active" ? "inactive" : "active"], {
                            onSuccess: () => mt.success(l.status === "active" ? "locations.deactivated" : "locations.activated"),
                          })}
                        >
                          {l.status === "active" ? t("deactivate") : t("activate")}
                        </Button>
                      </div>
                    ) : <span className="text-muted-foreground text-sm">—</span>}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={Boolean(draft)} onOpenChange={(o) => { if (!o) setDraft(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{draft?.id ? t("editTitle") : t("newTitle")}</DialogTitle></DialogHeader>
          {draft ? (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="loc-name">{t("form.name")}</Label>
                <Input id="loc-name" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="loc-city">{t("form.city")}</Label>
                  <Input id="loc-city" value={draft.city} onChange={(e) => setDraft({ ...draft, city: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="loc-addr">{t("form.address")}</Label>
                  <Input id="loc-addr" value={draft.address} onChange={(e) => setDraft({ ...draft, address: e.target.value })} />
                </div>
              </div>
              <label htmlFor="loc-default" className="flex cursor-pointer items-center gap-2 text-sm">
                <Checkbox id="loc-default" checked={draft.isDefault} onCheckedChange={(v) => setDraft({ ...draft, isDefault: v === true })} />
                {t("form.isDefault")}
              </label>
            </div>
          ) : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDraft(null)}>{t("cancel")}</Button>
            <Button onClick={submit} disabled={save.isPending}>{t("save")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
