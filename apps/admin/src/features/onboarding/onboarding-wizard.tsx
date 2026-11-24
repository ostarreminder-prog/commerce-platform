"use client";

import * as React from "react";
import { Check, ChevronLeft, ChevronRight, PartyPopper } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@repo/ui/components/button";
import { Card, CardContent } from "@repo/ui/components/card";
import { Checkbox } from "@repo/ui/components/checkbox";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import { useMsgToast } from "@repo/ui/components/msg-toast";
import { Progress } from "@repo/ui/components/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/select";
import { useStoreRouter } from "@/lib/store-route";
import { STEPS, type Step } from "./steps";

const INDUSTRIES = ["gifts", "perfumes", "fashion", "food", "other"] as const;

/* Module-level draft — survives the per-step route changes (`/onboarding/[step]`). */
const draft = {
  store: { name: "", industry: "gifts", city: "" },
  product: { name: "", price: "" },
  payments: { online: true, cod: true },
};

export function OnboardingWizard({ step }: { step: Step }) {
  const t = useTranslations("onboarding");
  const mt = useMsgToast();
  const router = useStoreRouter();
  const [store, setStoreState] = React.useState(draft.store);
  const [product, setProductState] = React.useState(draft.product);
  const [payments, setPaymentsState] = React.useState(draft.payments);
  const [error, setError] = React.useState<string | null>(null);
  const setStore = (fn: (s: typeof draft.store) => typeof draft.store) => setStoreState((s) => (draft.store = fn(s)));
  const setProduct = (fn: (p: typeof draft.product) => typeof draft.product) => setProductState((p) => (draft.product = fn(p)));
  const setPayments = (fn: (p: typeof draft.payments) => typeof draft.payments) => setPaymentsState((p) => (draft.payments = fn(p)));

  const stepIndex = STEPS.indexOf(step);
  const isLast = step === "done";
  const percent = Math.round(((stepIndex + (isLast ? 1 : 0)) / STEPS.length) * 100);
  const go = (index: number) => router.push(`/onboarding/${STEPS[Math.max(0, Math.min(index, STEPS.length - 1))]}`);

  const validate = (): boolean => {
    if (step === "store" && !store.name.trim()) {
      setError(t("errors.required"));
      return false;
    }
    if (step === "product") {
      if (!product.name.trim()) {
        setError(t("errors.required"));
        return false;
      }
      if (product.price && (Number.isNaN(Number(product.price)) || Number(product.price) <= 0)) {
        setError(t("errors.price"));
        return false;
      }
    }
    setError(null);
    return true;
  };

  const next = () => {
    if (!validate()) return;
    mt.success("onboarding.step.saved", { step: t(`steps.${step}`) });
    go(stepIndex + 1);
  };

  const skip = () => {
    setError(null);
    go(stepIndex + 1);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground text-sm">{t("subtitle")}</p>
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">{t("step", { n: Math.min(stepIndex + 1, STEPS.length), total: STEPS.length })}</span>
          <span className="text-muted-foreground">{t(`steps.${step}`)}</span>
        </div>
        <Progress value={percent} aria-label={t("title")} />
      </div>
      <Card>
        <CardContent className="space-y-5 p-6">
          {step === "store" ? (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="ob-name">{t("storeForm.name")} *</Label>
                <Input id="ob-name" value={store.name} onChange={(e) => setStore((s) => ({ ...s, name: e.target.value }))} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>{t("storeForm.industry")}</Label>
                  <Select value={store.industry} onValueChange={(v) => setStore((s) => ({ ...s, industry: v }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {INDUSTRIES.map((k) => (
                        <SelectItem key={k} value={k}>
                          {t(`industries.${k}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="ob-city">{t("storeForm.city")}</Label>
                  <Input id="ob-city" value={store.city} onChange={(e) => setStore((s) => ({ ...s, city: e.target.value }))} />
                </div>
              </div>
            </>
          ) : null}
          {step === "product" ? (
            <>
              <p className="text-muted-foreground text-sm">{t("productForm.hint")}</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="ob-product">{t("productForm.name")} *</Label>
                  <Input id="ob-product" value={product.name} onChange={(e) => setProduct((p) => ({ ...p, name: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="ob-price">{t("productForm.price")}</Label>
                  <Input id="ob-price" dir="ltr" inputMode="decimal" className="num text-start" value={product.price} onChange={(e) => setProduct((p) => ({ ...p, price: e.target.value }))} />
                </div>
              </div>
            </>
          ) : null}
          {step === "payment" ? (
            <div className="space-y-4">
              <p className="text-muted-foreground text-sm">{t("paymentForm.hint")}</p>
              <Label className="flex items-center gap-2.5 rounded-md border p-3">
                <Checkbox checked={payments.online} onCheckedChange={(v) => setPayments((p) => ({ ...p, online: v === true }))} />
                <span className="text-sm font-normal">{t("paymentForm.online")}</span>
              </Label>
              <Label className="flex items-center gap-2.5 rounded-md border p-3">
                <Checkbox checked={payments.cod} onCheckedChange={(v) => setPayments((p) => ({ ...p, cod: v === true }))} />
                <span className="text-sm font-normal">{t("paymentForm.cod")}</span>
              </Label>
            </div>
          ) : null}
          {isLast ? (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <div className="bg-success/15 text-success flex size-14 items-center justify-center rounded-full">
                <PartyPopper className="size-7" aria-hidden />
              </div>
              <h2 className="text-xl font-semibold">{t("done.title")}</h2>
              <p className="text-muted-foreground max-w-sm text-sm">{t("done.body")}</p>
            </div>
          ) : null}
          {error ? <p className="text-destructive text-xs">{error}</p> : null}
        </CardContent>
      </Card>
      <div className="flex items-center justify-between">
        <div>
          {stepIndex > 0 && !isLast ? (
            <Button variant="ghost" onClick={() => go(stepIndex - 1)}>
              <ChevronRight aria-hidden />
              {t("back")}
            </Button>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          {!isLast ? (
            <>
              <Button variant="ghost" onClick={skip}>
                {t("skip")}
              </Button>
              <Button onClick={next}>
                {t("next")}
                <ChevronLeft aria-hidden />
              </Button>
            </>
          ) : (
            <Button onClick={() => router.push("/")}>
              <Check aria-hidden />
              {t("done.cta")}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
