import type { Meta, StoryObj } from "@storybook/react";
import { ProductImage } from "../components/product-image";

const meta: Meta = { title: "ProductImage" };
export default meta;

export const Default: StoryObj = {
  render: () => (
    <div className="flex items-start gap-4 p-6">
      <ProductImage hue={140} label="Coffee" className="size-24" />
      <ProductImage hue={25} label="Dates" className="size-24" />
      <ProductImage hue={330} label="Honey" className="size-24" />
    </div>
  ),
};
