import type { Meta, StoryObj } from "@storybook/react";
import { Package } from "lucide-react";
import { EmptyState } from "../components/empty-state";
import { Button } from "../components/button";

const meta: Meta = { title: "EmptyState" };
export default meta;

export const Default: StoryObj = {
  render: () => <EmptyState title="No products yet" description="Add your first product or import a catalog." />,
};

export const WithAction: StoryObj = {
  render: () => (
    <EmptyState
      icon={Package}
      title="No products yet"
      description="Add your first product or import a catalog."
      action={<Button size="sm">New product</Button>}
    />
  ),
};
