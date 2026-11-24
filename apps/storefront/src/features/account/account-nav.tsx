"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Gift, LogOut, MapPin, ShoppingBag, User } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMsgToast } from "@repo/ui/components/msg-toast";
import { cn } from "@repo/ui/lib/cn";
import { useSession } from "@/components/session-context";

const ITEMS = [
  { href: "/account/orders", key: "orders", icon: ShoppingBag },
  { href: "/account/addresses", key: "addresses", icon: MapPin },
  { href: "/account/rewards", key: "rewards", icon: Gift },
  { href: "/account/profile", key: "profile", icon: User },
] as const;

export function AccountNav() {
  const t = useTranslations("store");
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useSession();
  const mt = useMsgToast();
  return (
    <nav className="mb-6 flex gap-1 overflow-x-auto rounded-xl border p-1" aria-label={t("account.title")}>
      {ITEMS.map(({ href, key, icon: Icon }) => (
        <Link
          key={key}
          href={href}
          aria-current={pathname.startsWith(href) ? "page" : undefined}
          className={cn(
            "text-muted-foreground hover:text-foreground flex shrink-0 items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
            pathname.startsWith(href) && "bg-muted text-foreground",
          )}
        >
          <Icon className="size-4" aria-hidden />
          {t(`account.${key}`)}
        </Link>
      ))}
      <button
        type="button"
        onClick={() => {
          logout();
          mt.success("auth.logout.success");
          router.push("/");
        }}
        className="text-muted-foreground hover:text-destructive ms-auto flex shrink-0 items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors"
      >
        <LogOut className="size-4" aria-hidden />
        {t("account.logout")}
      </button>
    </nav>
  );
}
