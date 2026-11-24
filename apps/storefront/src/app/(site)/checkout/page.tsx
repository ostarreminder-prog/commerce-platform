import { Suspense } from "react";
import { CheckoutView } from "@/features/checkout/checkout-view";

export default function CheckoutPage() {
  return (
    <Suspense>
      <CheckoutView />
    </Suspense>
  );
}
