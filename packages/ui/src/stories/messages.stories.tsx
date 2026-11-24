import type { Meta, StoryObj } from "@storybook/react";
import * as React from "react";
import { Package } from "lucide-react";
import { Banner } from "../components/banner";
import { Button } from "../components/button";
import { ConfirmDialog } from "../components/confirm-dialog";
import { MsgEmptyState } from "../components/msg-empty-state";
import { PageError } from "../components/page-error";
import { useMsgToast } from "../components/msg-toast";

/** Unified message components — docs/UI_MESSAGES.md §23. RTL/dark via the toolbar. */
const meta: Meta = { title: "Messages" };
export default meta;

function ToastsDemo() {
  const mt = useMsgToast();
  return (
      <div className="flex flex-wrap gap-3 p-6">
        <Button variant="outline" onClick={() => mt.success("products.saved", { name: "Oud" })}>Success</Button>
        <Button variant="outline" onClick={() => mt.success("products.delete.success", { count: 3 }, { undo: () => mt.info("common.undo") })}>Success + undo</Button>
        <Button variant="outline" onClick={() => mt.error("common.server.error")}>Error (sticky)</Button>
        <Button variant="outline" onClick={() => mt.error("orders.refund.failed", { reason: "card declined" }, { retry: () => mt.info("common.retry") })}>Error + retry</Button>
        <Button variant="outline" onClick={() => mt.info("orders.new.toast", { number: 1042, amount: "350 SAR" })}>Info</Button>
      </div>
  );
}

export const Toasts: StoryObj = { render: () => <ToastsDemo /> };

function ConfirmDemo(props: Partial<React.ComponentProps<typeof ConfirmDialog>>) {
  const [open, setOpen] = React.useState(false);
  return (
    <div className="p-6">
      <Button onClick={() => setOpen(true)}>Open dialog</Button>
      <ConfirmDialog {...props} open={open} onOpenChange={setOpen} onConfirm={() => setOpen(false)} />
    </div>
  );
}

export const ConfirmNormal: StoryObj = {
  render: () => <ConfirmDemo titleKey="orders.cancel.title" bodyKey="orders.cancel.body" confirmKey="orders.cancel.confirm" params={{ number: 1042 }} />,
};
export const ConfirmDanger: StoryObj = {
  render: () => <ConfirmDemo danger titleKey="customers.deleteData.title" bodyKey="customers.deleteData.body" confirmKey="customers.deleteData.confirm" params={{ name: "Sara" }} />,
};
export const ConfirmRequireText: StoryObj = {
  render: () => <ConfirmDemo danger requireText="delete" titleKey="customers.deleteData.title" bodyKey="customers.deleteData.body" confirmKey="customers.deleteData.confirm" />,
};
export const ConfirmPending: StoryObj = {
  render: () => <ConfirmDemo pending titleKey="orders.cancel.title" bodyKey="orders.cancel.body" confirmKey="orders.cancel.confirm" />,
};

export const EmptyStates: StoryObj = {
  render: () => (
    <div className="grid gap-6 p-6 md:grid-cols-2">
      <MsgEmptyState emptyKey="products" icon={Package} onAction={() => {}} />
      <MsgEmptyState emptyKey="orders" />
      <MsgEmptyState emptyKey="inbox" />
      <MsgEmptyState emptyKey="coupons" />
    </div>
  ),
};

export const PageErrors: StoryObj = {
  render: () => (
    <div className="space-y-10 p-6">
      <PageError errorKey="load" onRetry={() => {}} />
      <PageError errorKey="load" retrying onRetry={() => {}} />
      <PageError errorKey="404" />
      <PageError errorKey="403" />
    </div>
  ),
};

export const Banners: StoryObj = {
  render: () => (
    <div className="space-y-3 p-6">
      <Banner variant="info" textKey="verification.banner.inReview" />
      <Banner variant="success" textKey="shipments.delayed.banner" params={{ count: 3 }} />
      <Banner variant="warning" textKey="billing.trial.banner" params={{ days: 5 }} />
      <Banner variant="error" textKey="billing.pastDue.banner" params={{ date: "2026-12-01" }} />
      <Banner variant="danger" textKey="admin.support.banner" params={{ store: "Nakhla", reason: "payment issue", time: "58:12" }} />
      <Banner variant="info" textKey="verification.banner.inReview" onDismiss={() => {}} />
    </div>
  ),
};
