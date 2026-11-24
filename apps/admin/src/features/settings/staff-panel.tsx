"use client";

import * as React from "react";
import { UserPlus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useInviteStaff, useRoles, useStaffList } from "@repo/api-client";
import { Avatar, AvatarFallback } from "@repo/ui/components/avatar";
import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@repo/ui/components/dialog";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/select";
import { Skeleton } from "@repo/ui/components/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@repo/ui/components/table";
import { useMsgToast } from "@repo/ui/components/msg-toast";
import { useAppLocale } from "@repo/ui/hooks/use-app-locale";
import { formatRelativeTime } from "@repo/ui/lib/format";

/** Staff — table + invite dialog (spec §5.24: name, email, role, status, last login, MFA). */
export function StaffPanel() {
  const t = useTranslations("settings");
  const mt = useMsgToast();
  const { locale } = useAppLocale();
  const { data: staff, isPending } = useStaffList();
  const { data: roles } = useRoles();
  const invite = useInviteStaff();
  const [open, setOpen] = React.useState(false);
  const [form, setForm] = React.useState({ name: "", email: "", roleId: "" });
  const roleName = (id: string) => roles?.find((r) => r.id === id)?.name ?? id;
  const submit = () =>
    invite.mutate([form], {
      onSuccess: () => {
        mt.success("staff.invited", { email: form.email });
        setOpen(false);
        setForm({ name: "", email: "", roleId: "" });
      },
      onError: () => mt.error("validation.email.taken"),
    });
  if (isPending || !staff) return <Skeleton className="h-96 w-full" />;
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">{t("nav.staff")}</CardTitle>
        <Button size="sm" onClick={() => setOpen(true)}>
          <UserPlus aria-hidden />
          {t("staff.invite")}
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("staff.cols.name")}</TableHead>
              <TableHead>{t("staff.cols.email")}</TableHead>
              <TableHead>{t("staff.cols.role")}</TableHead>
              <TableHead>{t("staff.cols.status")}</TableHead>
              <TableHead>{t("staff.cols.lastLogin")}</TableHead>
              <TableHead>{t("staff.cols.mfa")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {staff.map((m) => (
              <TableRow key={m.id}>
                <TableCell>
                  <span className="flex items-center gap-2.5">
                    <Avatar className="size-8">
                      <AvatarFallback className="text-xs">{m.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">{m.name}</span>
                  </span>
                </TableCell>
                <TableCell dir="ltr" className="text-start">
                  {m.email}
                </TableCell>
                <TableCell>{roleName(m.roleId)}</TableCell>
                <TableCell>
                  <Badge variant={m.status === "active" ? "success" : m.status === "invited" ? "warning" : "secondary"}>{t(`staff.status.${m.status}`)}</Badge>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">{m.lastLoginAt ? formatRelativeTime(new Date(m.lastLoginAt), locale) : "—"}</TableCell>
                <TableCell>{m.mfaEnabled ? <Badge variant="outline">{t("staff.mfaOn")}</Badge> : "—"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("staff.inviteDialog.title")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="inv-name">{t("staff.inviteDialog.name")}</Label>
              <Input id="inv-name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="inv-email">{t("staff.inviteDialog.email")} *</Label>
              <Input id="inv-email" type="email" dir="ltr" className="text-start" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>{t("staff.inviteDialog.role")} *</Label>
              <Select value={form.roleId} onValueChange={(v) => setForm((f) => ({ ...f, roleId: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder={t("staff.inviteDialog.pickRole")} />
                </SelectTrigger>
                <SelectContent>
                  {(roles ?? []).map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              {t("cancel")}
            </Button>
            <Button loading={invite.isPending} disabled={!form.name.trim() || !form.email.includes("@") || !form.roleId} onClick={submit}>
              {t("staff.inviteDialog.submit")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
