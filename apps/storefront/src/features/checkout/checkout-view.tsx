"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, MessageCircle, ShoppingBag } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  useAddCustomerAddress,
  useAffiliates,
  useCheckGiftCardBalance,
  useCouponList,
  useCreateOrder,
  useLoyaltyAccount,
  useLoyaltySettings,
} from "@repo/api-client";
import type { Order } from "@repo/contracts";
import { Button } from "@repo/ui/components/button";
import { Card, CardContent } from "@repo/ui/components/card";
import { EmptyState } from "@repo/ui/components/empty-state";
import { useMsgToast } from "@repo/ui/components/msg-toast";
import { Skeleton } from "@repo/ui/components/skeleton";
import { toast } from "@repo/ui/components/toaster";
import { FREE_SHIPPING_FROM, useCart } from "@/components/cart-context";
import { useSession } from "@/components/session-context";
import { evaluateCoupon, readCouponCode, writeCouponCode } from "@/lib/coupon";
import { COD_FEE, DECLINE_CARD, DRAFT_KEY, GIFT_WRAP_FEE, NEW_ADDRESS, SHIPPING, type CheckoutDraft, type CheckoutInfo, type NewAddress, type PaymentMethod, type ShippingId, type Step } from "./checkout-constants";
import { InfoStep, type InfoErrors } from "./checkout-info";
import { PaymentStep, ShippingStep, StepsBar } from "./checkout-steps";
import { OrderSummaryCard } from "./checkout-summary";

const PAYMENT_METHOD_MAP: Record<PaymentMethod, Order["paymentMethod"]> = {
  mada: "mada",
  applePay: "apple_pay",
  stcPay: "stc_pay",
  tabby: "card",
  cod: "cod",
};

const EMPTY_INFO: CheckoutInfo = { name: "", phone: "", email: "" };
const EMPTY_ADDR: NewAddress = { city: "", district: "", street: "" };

export function CheckoutView() {
  const t = useTranslations("store");
  const mt = useMsgToast();
  const params = useSearchParams();
  const { lines, subtotal, ready, clear } = useCart();
  const { effective } = useSession();
  const { data: coupons = [], isPending: couponsPending } = useCouponList();
  const { data: affiliates = [] } = useAffiliates();
  const { data: loyaltySettings } = useLoyaltySettings();
  const createOrder = useCreateOrder();
  const addAddress = useAddCustomerAddress();
  const checkGiftCard = useCheckGiftCardBalance();
  const customer = effective;
  const { data: loyaltyAccount } = useLoyaltyAccount(customer?.id ?? "");

  const [step, setStep] = React.useState<Step>("info");
  const [info, setInfo] = React.useState<CheckoutInfo>(EMPTY_INFO);
  const [addressId, setAddressId] = React.useState<string | null>(null);
  const [newAddr, setNewAddr] = React.useState<NewAddress>(EMPTY_ADDR);
  const [errors, setErrors] = React.useState<InfoErrors>({});
  const [shippingId, setShippingId] = React.useState<ShippingId>("standard");
  const [payment, setPayment] = React.useState<PaymentMethod>("mada");
  const [card, setCard] = React.useState("");
  const [cardError, setCardError] = React.useState<string | null>(null);
  const [placing, setPlacing] = React.useState(false);
  const [done, setDone] = React.useState<{ name: string; number: number; id: string } | null>(null);
  const [draftReady, setDraftReady] = React.useState(false);

  /* --- Checkout extras --------------------------------------------------- */
  const [couponCode, setCouponCode] = React.useState<string | null>(null);
  const [gift, setGift] = React.useState<{ code: string; balance: number } | null>(null);
  const [giftInput, setGiftInput] = React.useState("");
  const [giftFail, setGiftFail] = React.useState<string | null>(null);
  const [affiliate, setAffiliate] = React.useState<string | null>(null);
  const [affiliateInput, setAffiliateInput] = React.useState("");
  const [affiliateFail, setAffiliateFail] = React.useState<string | null>(null);
  const [usePoints, setUsePoints] = React.useState(false);
  const [note, setNote] = React.useState("");
  const [wrap, setWrap] = React.useState(false);

  /* Draft restore: a `?coupon=` deep link wins over the stored code. */
  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const d = JSON.parse(raw) as Partial<CheckoutDraft>;
        if (d.info) setInfo({ ...EMPTY_INFO, ...d.info });
        if (d.addressId !== undefined) setAddressId(d.addressId ?? null);
        if (d.newAddr) setNewAddr({ ...EMPTY_ADDR, ...d.newAddr });
        if (d.shippingId) setShippingId(d.shippingId);
        if (d.payment) setPayment(d.payment);
      }
      setCouponCode(params.get("coupon") ?? readCouponCode());
    } catch {
      /* corrupted draft — start clean */
    }
    setDraftReady(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* Draft persistence + customer prefill once both are known. */
  const [prefilled, setPrefilled] = React.useState(false);
  React.useEffect(() => {
    if (!draftReady || !customer || prefilled) return;
    setPrefilled(true);
    setInfo((s) => (s.name.trim() ? s : { name: customer.name ?? "", phone: customer.phone, email: customer.email ?? "" }));
    setAddressId((s) => s ?? customer.addresses.find((a) => a.isDefault)?.id ?? customer.addresses[0]?.id ?? (customer.addresses.length ? null : NEW_ADDRESS));
  }, [draftReady, customer, prefilled]);

  React.useEffect(() => {
    if (!draftReady) return;
    const draft: CheckoutDraft = { info, addressId, newAddr, shippingId, payment };
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    } catch {
      /* storage may be unavailable */
    }
  }, [draftReady, info, addressId, newAddr, shippingId, payment]);

  /* --- Totals ------------------------------------------------------------ */
  const couponResult = React.useMemo(
    () => (couponCode && !couponsPending ? evaluateCoupon(couponCode, coupons, lines, customer) : null),
    [couponCode, coupons, couponsPending, lines, customer],
  );
  const discount = couponResult?.ok ? couponResult.discount : 0;
  const freeShip = Boolean(couponResult?.ok && couponResult.freeShipping);
  const needsShipping = lines.some((l) => l.product.product.requiresShipping);
  const method = SHIPPING.find((s) => s.id === shippingId) ?? SHIPPING[0];
  const shipping = needsShipping ? (freeShip ? 0 : (method.id === "standard" && subtotal - discount >= FREE_SHIPPING_FROM ? 0 : method.fee) + (payment === "cod" ? COD_FEE : 0)) : 0;
  const pointsBalance = loyaltyAccount?.points ?? 0;
  const redeemRate = loyaltySettings?.redeemRate ?? 0;
  const wrapFee = wrap ? GIFT_WRAP_FEE : 0;
  const beforePoints = subtotal - discount + shipping + wrapFee;
  const pointsToUse = usePoints && redeemRate > 0 ? Math.min(pointsBalance, Math.ceil(Math.max(0, beforePoints) / redeemRate)) : 0;
  const pointsValue = Math.round(pointsToUse * redeemRate);
  const total = Math.max(0, beforePoints - pointsValue);
  const giftApplied = gift ? Math.min(gift.balance, total) : 0;
  const payable = Math.max(0, total - giftApplied);

  /* --- Validation + order ----------------------------------------------- */
  const validateInfo = () => {
    const e: InfoErrors = {};
    if (!info.name.trim()) e.name = t("errors.required");
    if (!/^05\d{8}$/.test(info.phone.replace(/\s/g, ""))) e.phone = t("errors.phone");
    if (info.email.trim() && !/^\S+@\S+\.\S+$/.test(info.email.trim())) e.email = t("errors.email");
    if (addressId === NEW_ADDRESS || (customer?.addresses.length ?? 0) === 0) {
      if (!newAddr.city) e.city = t("errors.required");
      if (!newAddr.district.trim()) e.district = t("errors.required");
      if (!newAddr.street.trim()) e.street = t("errors.required");
    } else if (!addressId) e.address = t("errors.required");
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const applyGiftCard = () => {
    const code = giftInput.trim();
    if (!code) return;
    setGiftFail(null);
    checkGiftCard.mutate(code, {
      onSuccess: (r) => {
        if (r.balance <= 0 || r.status === "redeemed") setGiftFail(t("giftCardErrors.empty"));
        else if (r.status === "deactivated") setGiftFail(t("giftCardErrors.deactivated"));
        else if (r.status === "expired") setGiftFail(t("giftCardErrors.expired"));
        else setGift({ code: r.code, balance: r.balance });
      },
      onError: () => setGiftFail(t("giftCardErrors.notFound")),
    });
  };

  const applyAffiliate = () => {
    const code = affiliateInput.trim().toLowerCase();
    if (!code) return;
    const found = affiliates.find((a) => a.code.toLowerCase() === code);
    if (!found || found.status !== "active") setAffiliateFail(t("affiliateInvalid"));
    else {
      setAffiliate(found.code);
      setAffiliateFail(null);
    }
  };

  const submitOrder = (address: string) => {
    if (!customer) return;
    createOrder.mutate(
      [
        {
          customerId: customer.id,
          items: lines.map((l) => ({ variantId: l.variant.id, quantity: l.qty })),
          addressId: address,
          shippingFee: shipping,
          discount,
          paymentMethod: PAYMENT_METHOD_MAP[payment],
          channel: "storefront",
          markPaid: payment !== "cod",
          shipping: needsShipping ? { carrier: t(`shipCarrier.${method.id}`), service: t(`shipService.${method.id}`), etaDays: method.etaDays } : undefined,
          couponCode: couponResult?.ok ? couponResult.coupon?.code : null,
          giftCardCode: gift?.code ?? null,
          loyaltyPoints: pointsToUse > 0 ? pointsToUse : undefined,
          affiliateCode: affiliate,
          customerNote: note.trim() || null,
          giftWrap: wrap ? { fee: GIFT_WRAP_FEE } : null,
          internalNote: "",
          sendPaymentLink: false,
          sendConfirmation: true,
        },
      ],
      {
        onSuccess: (order) => {
          setDone({ name: info.name.split(" ")[0] ?? info.name, number: order.number, id: order.id });
          clear();
          writeCouponCode(null);
          try {
            localStorage.removeItem(DRAFT_KEY);
          } catch {
            /* noop */
          }
          setPlacing(false);
        },
        onError: (err) => {
          const code = err instanceof Error ? err.message : "";
          if (code.startsWith("insufficient_stock")) toast.error(t("errors.insufficientStock"));
          else if (code.startsWith("gift_card")) toast.error(t(`giftCardErrors.${code === "gift_card_not_found" ? "notFound" : code === "gift_card_empty" ? "empty" : "deactivated"}`));
          else mt.error("common.server.error");
          setPlacing(false);
        },
      },
    );
  };

  const placeOrder = () => {
    if (payment === "mada") {
      const digits = card.replace(/\s/g, "");
      if (digits.length < 16) return setCardError(t("errors.card"));
      /* Mock gateway simulation — the decline test card fails the charge. */
      if (digits === DECLINE_CARD) return setCardError(t("errors.cardDeclined"));
    }
    if (!customer || lines.length === 0) {
      mt.error("common.server.error");
      return;
    }
    setPlacing(true);
    if (addressId === NEW_ADDRESS || (customer.addresses.length === 0 && !addressId)) {
      addAddress.mutate(
        [
          customer.id,
          {
            label: null,
            recipientName: info.name,
            phone: info.phone,
            city: newAddr.city as (typeof customer.addresses)[number]["city"],
            district: newAddr.district,
            street: newAddr.street || null,
            buildingNumber: null,
            additionalNumber: null,
            postalCode: null,
            shortAddress: null,
            location: null,
            notes: null,
            isDefault: customer.addresses.length === 0,
          },
        ],
        {
          onSuccess: (a) => submitOrder(a.id),
          onError: () => {
            mt.error("common.server.error");
            setPlacing(false);
          },
        },
      );
    } else if (addressId) {
      submitOrder(addressId);
    } else {
      setPlacing(false);
      mt.error("common.server.error");
    }
  };

  if (done)
    return (
      <div className="container max-w-lg py-16 text-center">
        <CheckCircle2 className="text-success mx-auto size-16" aria-hidden />
        <h1 className="mt-4 text-2xl font-bold">{t("successTitle")}</h1>
        <p className="text-muted-foreground mt-2">{t("successText", { name: done.name, number: done.number })}</p>
        <div className="mt-6 flex justify-center gap-3">
          <Button asChild>
            <Link href={`/order/${done.id}`}>
              <MessageCircle aria-hidden />
              {t("track.title")}
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/">{t("continue")}</Link>
          </Button>
        </div>
      </div>
    );

  if (!ready) return <Skeleton className="container my-10 h-96" />;
  if (lines.length === 0)
    return (
      <div className="container py-16">
        <EmptyState icon={ShoppingBag} title={t("cartEmpty")} action={<Button asChild><Link href="/">{t("continue")}</Link></Button>} />
      </div>
    );

  const couponFail = couponResult && !couponResult.ok ? couponResult.reason : null;

  return (
    <div className="container space-y-6 py-8">
      <h1 className="text-2xl font-bold">{t("checkoutTitle")}</h1>
      <StepsBar step={step} />
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 [&>*]:min-w-0">
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="space-y-6 p-5 sm:p-6">
              {step === "info" ? (
                <InfoStep
                  customer={customer}
                  info={info}
                  errors={errors}
                  setInfo={setInfo}
                  addressId={addressId}
                  onAddress={setAddressId}
                  newAddr={newAddr}
                  setNewAddr={setNewAddr}
                  onNext={() => {
                    if (validateInfo()) setStep(needsShipping ? "shipping" : "payment");
                  }}
                />
              ) : null}
              {step === "shipping" && needsShipping ? (
                <ShippingStep
                  shippingId={shippingId}
                  onSelect={setShippingId}
                  subtotal={subtotal}
                  discount={discount}
                  freeShipCoupon={freeShip}
                  onBack={() => setStep("info")}
                  onNext={() => setStep("payment")}
                />
              ) : null}
              {step === "payment" ? (
                <PaymentStep
                  payment={payment}
                  onSelect={setPayment}
                  card={card}
                  onCardChange={(value) => {
                    setCardError(null);
                    setCard(value);
                  }}
                  cardError={cardError}
                  placing={placing}
                  total={total}
                  payable={payable}
                  extras={{
                    gift,
                    giftInput,
                    onGiftInput: setGiftInput,
                    onGiftApply: applyGiftCard,
                    onGiftRemove: () => {
                      setGift(null);
                      setGiftInput("");
                      setGiftFail(null);
                    },
                    giftFail,
                    giftPending: checkGiftCard.isPending,
                    affiliate,
                    affiliateInput,
                    onAffiliateInput: setAffiliateInput,
                    onAffiliateApply: applyAffiliate,
                    onAffiliateRemove: () => {
                      setAffiliate(null);
                      setAffiliateInput("");
                      setAffiliateFail(null);
                    },
                    affiliateFail,
                    loyalty: loyaltySettings?.enabled
                      ? { balance: pointsBalance, usePoints, pointsToUse, pointsValue, onToggle: setUsePoints }
                      : null,
                  }}
                  onBack={() => setStep(needsShipping ? "shipping" : "info")}
                  onPlace={placeOrder}
                />
              ) : null}
            </CardContent>
          </Card>
        </div>
        <OrderSummaryCard lines={lines} subtotal={subtotal} shipping={shipping} discount={discount + pointsValue} giftCard={giftApplied} giftWrap={wrap} note={note} onNote={setNote} onGiftWrap={setWrap} couponFail={couponFail} />
      </div>
    </div>
  );
}
