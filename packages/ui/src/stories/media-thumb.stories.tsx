import type { Meta, StoryObj } from "@storybook/react";
import { MediaThumb } from "../components/media-thumb";

const meta: Meta = { title: "MediaThumb" };
export default meta;

export const Placeholder: StoryObj = {
  render: () => (
    <div className="flex items-center gap-4 p-6">
      <MediaThumb url={null} label="Hero banner" />
      <MediaThumb url="about:blank" label="Logo" className="size-14" />
    </div>
  ),
};

export const RealImage: StoryObj = {
  render: () => <MediaThumb url="https://picsum.photos/seed/nakhla/96/96" label="Coffee bag" />,
};
