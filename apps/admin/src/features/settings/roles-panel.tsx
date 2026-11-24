"use client";

import * as React from "react";
import { Plus, ShieldCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRoles, useSaveRole, useStaffList } from "@repo/api-client";
import { PERMISSION_GROUPS, type Permission, type PermissionGroup, type Role } from "@repo/contracts";
import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/card";
import { Checkbox } from "@repo/ui/components/checkbox";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import { Skeleton } from "@repo/ui/components/skeleton";
import { Textarea } from "@repo/ui/components/textarea";
import { useMsgToast } from "@repo/ui/components/msg-toast";
import { cn } from "@repo/ui/lib/cn";
import { SaveFooter } from "./settings-fields";

const GROUPS = Object.keys(PERMISSION_GROUPS) as PermissionGroup[];

function RoleEditor({ role, onDone }: { role: Role | "new"; onDone: () => void }) {
  const t = useTranslations("settings");
  const mt = useMsgToast();
  const save = useSaveRole();
  const isNew = role === "new";
  const locked = !isNew && role.isSystem;
  const [name, setName] = React.useState(isNew ? "" : role.name);
  const [description, setDescription] = React.useState(isNew ? "" : role.description);
  const [perms, setPerms] = React.useState<Set<Permission>>(new Set(isNew ? [] : role.permissions));
  const toggle = (p: Permission) =>
    setPerms((all) => {
      const next = new Set(all);
      if (next.has(p)) next.delete(p);
      else next.add(p);
      return next;
    });
  const enabledGroups = GROUPS.filter((g) => PERMISSION_GROUPS[g].some((p) => perms.has(p))).map((g) => t(`roles.groups.${g}`));
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{isNew ? t("roles.new") : name}</CardTitle>
        {locked ? <p className="text-muted-foreground text-xs">{mt.text("roles.system.locked")}</p> : null}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="role-name">{t("roles.name")}</Label>
            <Input id="role-name" value={name} onChange={(e) => setName(e.target.value)} disabled={locked} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="role-desc">{t("roles.description")}</Label>
            <Textarea id="role-desc" rows={1} value={description} onChange={(e) => setDescription(e.target.value)} disabled={locked} />
          </div>
        </div>
        <div className="space-y-3">
          {GROUPS.map((g) => (
            <fieldset key={g} className="rounded-lg border p-3">
              <legend className="px-1 text-sm font-medium">{t(`roles.groups.${g}`)}</legend>
              <div className="grid gap-2 sm:grid-cols-2">
                {PERMISSION_GROUPS[g].map((p) => (
                  <Label key={p} className="flex items-center gap-2.5 text-sm font-normal">
                    <Checkbox checked={perms.has(p)} disabled={locked} onCheckedChange={() => toggle(p)} />
                    {t(`roles.perms.${p}`)}
                  </Label>
                ))}
              </div>
            </fieldset>
          ))}
        </div>
        <p className="text-muted-foreground rounded-lg border p-3 text-sm">{mt.text("roles.summary", { summary: enabledGroups.join("، ") || "—" })}</p>
      </CardContent>
      {!locked ? (
        <SaveFooter
          pending={save.isPending}
          onSave={() =>
            save.mutate([{ id: isNew ? undefined : role.id, name, description, permissions: [...perms] }], {
              onSuccess: () => {
                mt.success("roles.saved", { name, count: perms.size });
                onDone();
              },
            })
          }
        />
      ) : null}
    </Card>
  );
}

/** Roles — list + permission editor grouped by section (spec §5.24). */
export function RolesPanel() {
  const t = useTranslations("settings");
  const { data: roles, isPending } = useRoles();
  const { data: staff } = useStaffList();
  const [selected, setSelected] = React.useState<string | "new" | null>(null);
  if (isPending || !roles) return <Skeleton className="h-96 w-full" />;
  const current = selected === "new" ? "new" : (roles.find((r) => r.id === selected) ?? null);
  const count = (roleId: string) => staff?.filter((s) => s.roleId === roleId).length ?? 0;
  return (
    <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">{t("roles.list")}</CardTitle>
          <Button size="sm" variant="outline" onClick={() => setSelected("new")}>
            <Plus aria-hidden />
          </Button>
        </CardHeader>
        <CardContent className="space-y-1">
          {roles.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => setSelected(r.id)}
              className={cn(
                "flex w-full items-center gap-2 rounded-md px-3 py-2 text-start text-sm",
                selected === r.id ? "bg-accent text-accent-foreground" : "hover:bg-accent/50",
              )}
            >
              <ShieldCheck className="text-muted-foreground size-4 shrink-0" aria-hidden />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">{r.name}</span>
                <span className="text-muted-foreground block truncate text-xs">{r.description}</span>
              </span>
              {r.isSystem ? <Badge variant="outline">{t("roles.system")}</Badge> : null}
              <span className="num text-muted-foreground text-xs">{count(r.id)}</span>
            </button>
          ))}
        </CardContent>
      </Card>
      <div className="min-w-0">
        {current ? (
          <RoleEditor key={current === "new" ? "new" : current.id} role={current} onDone={() => setSelected(null)} />
        ) : (
          <Card>
            <CardContent className="text-muted-foreground p-8 text-center text-sm">{t("roles.pick")}</CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
