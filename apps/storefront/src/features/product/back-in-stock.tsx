"use client";

import * as React from "react";
import { BellRing } from "lucide-react";
import { useTranslations } from "next-intl";
import type { StoreProduct } from "@/lib/store-product";
import { useBackInStockSubscribe } from "@repo/api-client";
import { Button } from "@repo/ui/components/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@repo/ui/components/dialog";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import { toast } from "@repo/ui/components/toaster";
import { useStoreFeatures } from "@/lib/features";

/** "أعلمني عند التوفر" — phone dialog that posts to commerce.backInStock.subscribe. */
export function BackInStockButton({ product: p }: { product: StoreProduct }) {
  const t = useTranslations("store");
  const { on } = useStoreFeatures();
  const subscribe = useBackInStockSubscribe();
  const [open, setOpen] = React.useState(false);
  const [phone, setPhone] = React.useState("");
  if (!on("backInStock") || p.stock > 0) return null;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    subscribe.mutate([p.id, phone.trim()], {
      onSuccess: () => {
        toast.success(t("notifySuccess"));
        setOpen(false);
      },
    });
  };

  return (
    <>
      <Button size="lg" variant="outline" className="flex-1 gap-2" onClick={() => setOpen(true)}>
        <BellRing className="size-4" aria-hidden />
        {t("notifyMe")}
      </Button>
      {open ? (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>{t("notifyMe")}</DialogTitle>
              <DialogDescription>{t("notifyMeText")}</DialogDescription>
            </DialogHeader>
            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="bis-phone">{t("phone")}</Label>
                <Input
                  id="bis-phone"
                  dir="ltr"
                  inputMode="tel"
                  placeholder="05xxxxxxxx"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={!phone.trim() || subscribe.isPending}>
                  {t("notifyMe")}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      ) : null}
    </>
  );
}
