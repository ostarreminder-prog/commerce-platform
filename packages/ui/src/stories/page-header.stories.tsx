import type { Meta, StoryObj } from "@storybook/react";
import { PageHeader } from "../components/page-header";
import { Button } from "../components/button";

const meta: Meta = { title: "PageHeader" };
export default meta;

export const Default: StoryObj = {
  render: () => <PageHeader title="Products" description="All your products, variants and stock." />,
};

export const WithActions: StoryObj = {
  render: () => (
    <PageHeader
      title="Orders"
      description="Track and fulfil your store orders."
      actions={<Button size="sm">New order</Button>}
    />
  ),
};
