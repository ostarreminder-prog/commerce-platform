"use client";

import Link from "@/components/store-link";
import { CircleHelp, CreditCard, LogOut, ShieldCheck, User } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMe } from "@repo/api-client";
import { Avatar, AvatarFallback } from "@repo/ui/components/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@repo/ui/components/dropdown-menu";
import { DEFAULT_ROLES, type Role } from "@repo/contracts";
import { usePermissions } from "@/lib/permissions";

export function UserMenu() {
  const t = useTranslations("topbar");
  const { data: user } = useMe();
  const { roles, role, setRole } = usePermissions();
  const initials = user?.name.split(" ").map((p) => p.charAt(0)).slice(0, 2).join(" ") ?? "";
  /* System roles (`role_<key>`) get translated labels; custom roles show their stored name. */
  const looseT = t as unknown as (key: string) => string;
  const roleLabel = (r: Role | null) => {
    if (!r) return "…";
    const key = r.id.replace(/^role_/, "");
    return key in DEFAULT_ROLES ? looseT(`roles.${key}`) : r.name;
  };
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="focus-visible:ring-ring rounded-full focus-visible:outline-none focus-visible:ring-2"
        aria-label={t("account")}
      >
        <Avatar className="size-9">
          <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">{initials}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel className="font-normal">
          <p className="text-sm font-semibold">{user?.name}</p>
          <p className="text-muted-foreground text-xs" dir="ltr">
            {user?.email}
          </p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/settings/profile">
            <User aria-hidden />
            {t("profile")}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/settings/billing">
            <CreditCard aria-hidden />
            {t("billing")}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <ShieldCheck aria-hidden />
            {t("viewAs")}: {roleLabel(role)}
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuRadioGroup value={role?.id ?? ""} onValueChange={setRole}>
              {roles.map((r) => (
                <DropdownMenuRadioItem key={r.id} value={r.id}>
                  {roleLabel(r)}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuItem>
          <CircleHelp aria-hidden />
          {t("help")}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild className="text-destructive focus:text-destructive">
          <Link href="/login">
            <LogOut aria-hidden />
            {t("logout")}
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
