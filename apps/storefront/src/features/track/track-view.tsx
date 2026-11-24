"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PackageSearch } from "lucide-react";
import { useTranslations } from "next-intl";
import { useLookupOrder } from "@repo/api-client";
import type { Order } from "@repo/contracts";
import { Button } from "@repo/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/card";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import { Breadcrumbs } from "@/components/breadcrumbs";

/** Guest order lookup — order number + the phone it was placed with. */
export function OrderLookupCard({ onFound }: { onFound?: (order: Order) => void }) {
  const t = useTranslations("store");
  const router = useRouter();
  const lookup = useLookupOrder();
  const [number, setNumber] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    lookup.mutate(
      { number: Number(number), phone: phone.trim() },
      {
        onSuccess: (o) => (onFound ? onFound(o) : router.push(`/order/${o.id}`)),
        onError: (err) => setError(err instanceof Error && err.message === "phone_mismatch" ? t("track.phoneMismatch") : t("track.notFound")),
      },
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <PackageSearch className="text-primary size-5" aria-hidden />
          {t("track.title")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="trk-number">{t("track.orderNumber")}</Label>
              <Input id="trk-number" dir="ltr" inputMode="numeric" required value={number} onChange={(e) => setNumber(e.target.value.replace(/\D/g, ""))} placeholder="10290" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="trk-phone">{t("phone")}</Label>
              <Input id="trk-phone" dir="ltr" inputMode="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="05XXXXXXXX" />
            </div>
          </div>
          {error ? (
            <p className="text-destructive text-sm" role="alert">
              {error}
            </p>
          ) : null}
          <Button type="submit" loading={lookup.isPending} disabled={!number || phone.replace(/\D/g, "").length < 9}>
            {t("track.submit")}
          </Button>
        </form>
        <p className="text-muted-foreground mt-3 text-xs">
          {t("track.haveAccount")}{" "}
          <Link href="/account/orders" className="text-primary hover:underline">
            {t("account.orders")}
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}

export function TrackView() {
  const t = useTranslations("store");
  return (
    <div className="container max-w-xl space-y-6 py-10">
      <Breadcrumbs items={[{ label: t("track.title") }]} />
      <div>
        <h1 className="text-2xl font-bold">{t("track.title")}</h1>
        <p className="text-muted-foreground text-sm">{t("track.subtitle")}</p>
      </div>
      <OrderLookupCard />
    </div>
  );
}
