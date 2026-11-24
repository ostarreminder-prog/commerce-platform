import type { Meta, StoryObj } from "@storybook/react";
import { Info, TriangleAlert } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "../components/alert";

const meta: Meta = { title: "Alert" };
export default meta;

export const Default: StoryObj = {
  render: () => (
    <Alert className="max-w-md">
      <Info className="size-4" />
      <AlertTitle>Heads up</AlertTitle>
      <AlertDescription>Your trial ends in 3 days. Add a payment method to keep your store live.</AlertDescription>
    </Alert>
  ),
};

export const Destructive: StoryObj = {
  render: () => (
    <Alert variant="destructive" className="max-w-md">
      <TriangleAlert className="size-4" />
      <AlertTitle>Payment failed</AlertTitle>
      <AlertDescription>The last payout attempt was rejected by the bank. Update your IBAN.</AlertDescription>
    </Alert>
  ),
};
