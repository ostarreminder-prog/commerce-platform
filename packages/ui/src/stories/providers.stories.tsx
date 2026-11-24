import type { Meta, StoryObj } from "@storybook/react";
import { UIProviders } from "../components/providers";
import { Button } from "../components/button";

const meta: Meta = { title: "UIProviders" };
export default meta;

export const Default: StoryObj = {
  render: () => (
    <UIProviders dir="rtl">
      <div className="p-6"><Button>Inside providers</Button></div>
    </UIProviders>
  ),
};
