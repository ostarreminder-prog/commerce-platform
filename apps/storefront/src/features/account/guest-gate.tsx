"use client";

import type * as React from "react";
import Link from "next/link";
import { UserRound } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@repo/ui/components/button";
import { Card, CardContent } from "@repo/ui/components/card";
import { Skeleton } from "@repo/ui/components/skeleton";
import { useSession } from "@/components/session-context";

/**
 * Wraps /account/* screens — guests see a sign-in prompt, members see the
 * content. Returns the session customer via render prop.
 */
export function GuestGate({ children }: { children: React.ReactNode }) {
  const t = useTranslations("store");
  const { status } = useSession();

  if (status === "loading")
    return (
      <div className="container max-w-3xl space-y-4 py-8">
        <Skeleton className="h-10 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );

  if (status === "guest")
    return (
      <div className="container flex max-w-3xl justify-center py-16">
        <Card className="w-full max-w-sm">
          <CardContent className="space-y-4 p-6 text-center">
            <span className="bg-primary/10 text-primary mx-auto flex size-11 items-center justify-center rounded-full">
              <UserRound className="size-5" aria-hidden />
            </span>
            <div className="space-y-1">
              <p className="font-semibold">{t("account.loginRequired")}</p>
              <p className="text-muted-foreground text-sm">{t("account.loginRequiredText")}</p>
            </div>
            <Button className="w-full" asChild>
              <Link href="/account/login">{t("account.loginButton")}</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );

  return <>{children}</>;
}
