"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  useAddCustomerAddress, useConversationById, useCouponList, useCreateOrder, useCustomerList, useInventoryLevels, useLocations, useOrderById, usePriceLists, useProductList,
} from "@repo/api-client";
import { type Order, type Product } from "@repo/contracts";
import { Button } from "@repo/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/card";
import { Label } from "@repo/ui/components/label";
import { RadioGroup, RadioGroupItem } from "@repo/ui/components/radio-group";
import { Separator } from "@repo/ui/components/separator";
import { Skeleton } from "@repo/ui/components/skeleton";
import { toast } from "@repo/ui/components/toaster";
import { useAppLocale } from "@repo/ui/hooks/use-app-locale";
import { cn } from "@repo/ui/lib/cn";
import { formatMoney } from "@repo/ui/lib/format";
import { Breadcrumbs } from "@/components/entity/breadcrumbs";
import { EntityLink } from "@/components/entity/entity-link";
import { useCan } from "@/lib/permissions";
import { useStoreRouter } from "@/lib/store-route";
import { recallListUrl } from "@/lib/url-state";
import { RATES } from "./order-dialogs";
import { toHalalas } from "@repo/ui/lib/money";
import { CustomerPicker } from "./customer-picker";
import { NewOrderItemsCard } from "./new-order-items-card";
import { NewOrderAddressCard } from "./new-order-address-card";
import { NewOrderPaymentCard } from "./new-order-payment-card";
import { NewOrderGrowthCard, type GrowthFields } from "./new-order-growth-card";
import { EMPTY_ADDRESS, PHONE_RE, couponDiscount, normalizePhone, type Line, type PaymentOption } from "./new-order-utils";

export function NewOrder() {
  const t = useTranslations("sales.newOrder");
  const ts = useTranslations("sales");
  const { locale } = useAppLocale();
  const router = useStoreRouter();
  const params = useSearchParams();
  const canEditPrice = useCan("prices.update");
  const customers = useCustomerList();
  const products = useProductList();
  const levels = useInventoryLevels();
  const coupons = useCouponList();
  const dup = useOrderById(params.get("duplicate") ?? "");
  const conv = useConversationById(params.get("conversation") ?? "");
  const create = useCreateOrder();
  const addAddress = useAddCustomerAddress();
  const locations = useLocations();
  const priceLists = usePriceLists();

  const [customerId, setCustomerId] = React.useState<string | null>(params.get("customer"));
  const [lines, setLines] = React.useState<Line[]>([]);
  const [addressId, setAddressId] = React.useState<string>("");
  const [newAddress, setNewAddress] = React.useState(EMPTY_ADDRESS);
  const [rate, setRate] = React.useState("0");
  const [couponCode, setCouponCode] = React.useState("");
  const [manualDiscount, setManualDiscount] = React.useState("");
  const [payment, setPayment] = React.useState<PaymentOption>("payment_link");
  const [note, setNote] = React.useState("");
  const [confirm, setConfirm] = React.useState(true);
  const [submitted, setSubmitted] = React.useState(false);
  const [growth, setGrowth] = React.useState<GrowthFields>({ locationId: "", affiliateCode: "", giftCardCode: "", loyaltyPoints: "" });
  const prefilled = React.useRef(false);

  const customer = customers.data?.find((c) => c.id === customerId);

  /* Default the fulfilment warehouse once locations load. */
  React.useEffect(() => {
    if (growth.locationId || !locations.data) return;
    const def = locations.data.find((l) => l.isDefault && l.status === "active") ?? locations.data.find((l) => l.status === "active");
    if (def) setGrowth((g) => ({ ...g, locationId: def.id }));
  }, [locations.data, growth.locationId]);

  /* B2B price-list resolution — an active list assigned to the customer
   * overrides the variant's base price (variant rule beats catch-all). */
  const resolvePrice = React.useCallback((variantId: string): number | null => {
    if (!customerId) return null;
    for (const list of (priceLists.data ?? []).filter((l) => l.status === "active" && l.customerIds.includes(customerId))) {
      const specific = list.rules.find((r) => r.variantId === variantId);
      const generic = list.rules.find((r) => r.variantId === null);
      const rule = specific ?? generic;
      if (!rule) continue;
      const v = products.data?.flatMap((p) => p.variants).find((x) => x.id === variantId);
      if (!v) continue;
      if (rule.fixedPrice) return rule.fixedPrice.amount;
      if (rule.percentOff != null) return Math.round(v.price.amount * (1 - rule.percentOff / 100));
    }
    return null;
  }, [customerId, priceLists.data, products.data]);

  /* Re-price lines when the picked customer changes. */
  React.useEffect(() => {
    if (!products.data) return;
    setLines((ls) => ls.map((l) => {
      const v = products.data.flatMap((p) => p.variants).find((x) => x.id === l.variantId);
      if (!v) return l;
      const resolved = resolvePrice(l.variantId);
      return { ...l, unitPrice: resolved ?? v.price.amount, basePrice: v.price.amount };
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerId, resolvePrice]);
  const available = React.useCallback((variantId: string) => {
    const l = levels.data?.filter((x) => x.variantId === variantId);
    return l?.length ? l.reduce((s, x) => s + x.available, 0) : null;
  }, [levels.data]);
  const toLine = React.useCallback((p: Product, variantId: string, quantity = 1, unitPrice?: number): Line | null => {
    const v = p.variants.find((x) => x.id === variantId);
    if (!v) return null;
    const name = (p.name[locale] ?? p.name.ar) + (v.optionValues.length ? ` · ${v.optionValues.join(" / ")}` : "");
    return { variantId, productId: p.id, name, sku: v.sku, image: p.media[0]?.url, quantity, unitPrice: unitPrice ?? v.price.amount, basePrice: v.price.amount, available: available(variantId) };
  }, [locale, available]);

  /* Re-declared post-resolvePrice — addLine resolves the customer price list. */

  React.useEffect(() => {
    if (prefilled.current || !products.data) return;
    const source: Order | undefined = dup.data;
    if (source) {
      prefilled.current = true;
      setCustomerId(source.customerId);
      setLines(source.items.flatMap((i) => { const p = products.data.find((x) => x.id === i.productId); const l = p && toLine(p, i.variantId, i.quantity); return l ? [l] : []; }));
      return;
    }
    if (conv.data) {
      prefilled.current = true;
      if (conv.data.customerId) setCustomerId(conv.data.customerId);
      const ids = [...new Set(conv.data.messages.flatMap((m) => (m.ref?.type === "product" ? [m.ref.id] : [])))];
      setLines(ids.flatMap((id) => { const p = products.data.find((x) => x.id === id); const v = p?.variants[0]; const l = p && v && toLine(p, v.id); return l ? [l] : []; }));
    }
  }, [dup.data, conv.data, products.data, toLine]);

  React.useEffect(() => {
    if (!customer) return;
    setAddressId((cur) => (customer.addresses.some((a) => a.id === cur) ? cur : customer.addresses.find((a) => a.isDefault)?.id ?? customer.addresses[0]?.id ?? "new"));
    setNewAddress((a) => ({ ...a, recipientName: a.recipientName || (customer.name ?? ""), phone: a.phone || customer.phone }));
  }, [customer]);

  const addLine = (p: Product, variantId: string) =>
    setLines((ls) => {
      const existing = ls.find((l) => l.variantId === variantId);
      if (existing) return ls.map((l) => (l.variantId === variantId ? { ...l, quantity: l.quantity + 1 } : l));
      const l = toLine(p, variantId);
      if (l) l.unitPrice = resolvePrice(variantId) ?? l.unitPrice;
      return l ? [...ls, l] : ls;
    });
  const patch = (variantId: string, p: Partial<Line>) => setLines((ls) => ls.map((l) => (l.variantId === variantId ? { ...l, ...p } : l)));

  const shipping = RATES[Number(rate)] ?? RATES[0];
  const shippingFee = shipping?.price ?? 0;
  const subtotal = lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0);
  const coupon = coupons.data?.find((c) => c.code === couponCode.trim().toUpperCase());
  const cd = couponCode.trim() ? (coupon ? couponDiscount(coupon, subtotal, shippingFee) : { amount: 0, error: "unknown" }) : { amount: 0, error: null };
  const manual = Math.min(toHalalas(manualDiscount || 0), subtotal - cd.amount);
  const discount = cd.amount + Math.max(0, manual);
  const total = Math.max(0, subtotal - discount + shippingFee);
  const tax = Math.round(total - total / 1.15);
  const overStock = lines.filter((l) => l.available !== null && l.quantity > l.available);

  const errors = {
    customer: !customer,
    items: lines.length === 0,
    address: addressId === "new" ? !newAddress.recipientName.trim() || !newAddress.district.trim() || !PHONE_RE.test(newAddress.phone.replace(/\s/g, "")) : !addressId,
  };
  const invalid = Object.values(errors).some(Boolean) || cd.error !== null;

  const submit = async () => {
    setSubmitted(true);
    if (invalid || !customer || !shipping) { toast.error(t("fixErrors")); return; }
    try {
      let aid = addressId;
      if (aid === "new") {
        const a = await addAddress.mutateAsync([customer.id, {
          label: null, recipientName: newAddress.recipientName.trim(), phone: normalizePhone(newAddress.phone), city: newAddress.city, district: newAddress.district.trim(),
          street: newAddress.street.trim() || null, buildingNumber: null, additionalNumber: null, postalCode: null, shortAddress: null, location: null, notes: null, isDefault: customer.addresses.length === 0,
        }]);
        aid = a.id;
      }
      const o = await create.mutateAsync([{
        customerId: customer.id, addressId: aid, shippingFee, discount, couponCode: coupon && !cd.error ? coupon.code : null,
        items: lines.map((l) => ({ variantId: l.variantId, quantity: l.quantity, unitPrice: l.unitPrice })),
        shipping: { carrier: shipping.carrier, service: shipping.service, etaDays: shipping.etaDays },
        paymentMethod: payment === "external" ? "bank_transfer" : payment, markPaid: payment === "external",
        internalNote: note.trim(), sendPaymentLink: payment === "payment_link", sendConfirmation: confirm, conversationId: conv.data?.id ?? null,
        locationId: growth.locationId || null,
        affiliateCode: growth.affiliateCode.trim() || null,
        giftCardCode: growth.giftCardCode.trim() || null,
        loyaltyPoints: Math.max(0, Math.floor(Number(growth.loyaltyPoints) || 0)),
      }]);
      toast.success(t("created", { number: o.number }));
      router.push(`/orders/${o.id}`);
    } catch (e) {
      /* The endpoint is authoritative — surface its rejection (e.g. the
       * insufficient_stock guard fires even when levels were still loading). */
      const code = String((e as Error).message ?? "");
      toast.error(code.startsWith("insufficient_stock") ? t("errors.insufficientStock") : t("failed"));
    }
  };

  const err = (k: keyof typeof errors) => (submitted && errors[k] ? <p className="text-destructive text-xs">{t(`errors.${k}`)}</p> : null);

  if (customers.isPending || products.isPending) {
    return <div className="space-y-6"><Skeleton className="h-9 w-64" /><div className="grid gap-6 lg:grid-cols-3"><Skeleton className="h-96 lg:col-span-2" /><Skeleton className="h-72" /></div></div>;
  }

  return (
    <div className="space-y-6 pb-8">
      <div>
        <Breadcrumbs items={[{ label: ts("orders.title"), href: recallListUrl("/orders") }, { label: t("title") }]} />
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        {conv.data ? <p className="text-muted-foreground mt-1 text-sm">{t("fromConversation")} <EntityLink type="conversation" id={conv.data.id} /></p> : null}
        {dup.data ? <p className="text-muted-foreground mt-1 text-sm">{t("duplicateOf")} <EntityLink type="order" id={dup.data.id} className="num" /></p> : null}
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="min-w-0 space-y-6 lg:col-span-2">
          <Card>
            <CardHeader><CardTitle className="text-base">{t("customer")} *</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <CustomerPicker customer={customer} onPick={(c) => setCustomerId(c?.id ?? null)} />
              {err("customer")}
            </CardContent>
          </Card>

          <NewOrderItemsCard lines={lines} addLine={addLine} patch={patch} setLines={setLines} canEditPrice={canEditPrice} error={err("items")} />

          <NewOrderAddressCard customer={customer} addressId={addressId} setAddressId={setAddressId} newAddress={newAddress} setNewAddress={setNewAddress} error={err("address")} />

          <Card>
            <CardHeader><CardTitle className="text-base">{t("shipping")}</CardTitle></CardHeader>
            <CardContent>
              <RadioGroup value={rate} onValueChange={setRate} className="grid gap-2 sm:grid-cols-2">
                {RATES.map((r, i) => (
                  <Label key={r.carrier} htmlFor={`no-rate-${i}`} className={cn("flex cursor-pointer items-center gap-3 rounded-md border p-3 font-normal", rate === String(i) && "border-primary bg-primary/5")}>
                    <RadioGroupItem id={`no-rate-${i}`} value={String(i)} />
                    <span className="flex-1"><span className="block font-medium">{r.carrier}</span><span className="text-muted-foreground block text-xs">{r.service}</span></span>
                    <span className="num text-sm font-semibold">{formatMoney(r.price, locale)}</span>
                  </Label>
                ))}
              </RadioGroup>
            </CardContent>
          </Card>

          <NewOrderPaymentCard
            couponCode={couponCode}
            setCouponCode={setCouponCode}
            coupon={coupon}
            cd={cd}
            manualDiscount={manualDiscount}
            setManualDiscount={setManualDiscount}
            payment={payment}
            setPayment={setPayment}
            note={note}
            setNote={setNote}
            confirm={confirm}
            setConfirm={setConfirm}
          />

          <NewOrderGrowthCard customerId={customerId} fields={growth} set={(p) => setGrowth((g) => ({ ...g, ...p }))} />
        </div>

        <div className="min-w-0">
          <Card className="lg:sticky lg:top-20">
            <CardHeader><CardTitle className="text-base">{t("summary")}</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">{t("subtotal", { count: lines.reduce((s, l) => s + l.quantity, 0) })}</span><span className="num">{formatMoney(subtotal, locale)}</span></div>
              {discount ? <div className="flex justify-between"><span className="text-muted-foreground">{t("discount")}</span><span className="num">{formatMoney(-discount, locale)}</span></div> : null}
              <div className="flex justify-between"><span className="text-muted-foreground">{t("shippingFee")}</span><span className="num">{formatMoney(shippingFee, locale)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">{t("taxIncluded")}</span><span className="num">{formatMoney(tax, locale)}</span></div>
              <Separator />
              <div className="flex justify-between text-base font-semibold"><span>{t("total")}</span><span className="num">{formatMoney(total, locale)}</span></div>
              {overStock.length ? <p className="text-warning text-xs">{t("overStockWarning", { count: overStock.length })}</p> : null}
              <Button className="mt-2 w-full" onClick={submit} disabled={create.isPending || addAddress.isPending}>{t("submit")}</Button>
              <Button variant="ghost" className="w-full" onClick={() => router.push(recallListUrl("/orders"))}>{t("cancel")}</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
