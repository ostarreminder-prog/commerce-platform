import type { Meta, StoryObj } from "@storybook/react";
import { LocaleSwitcher } from "../components/locale-switcher";

const meta: Meta = { title: "LocaleSwitcher" };
export default meta;

export const Default: StoryObj = {
  render: () => <div className="p-6"><LocaleSwitcher onLocaleChange={(l) => alert(`switch to ${l}`)} /></div>,
};
