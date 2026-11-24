import type { Meta, StoryObj } from "@storybook/react";
import { ErrorState } from "../components/error-state";

const meta: Meta = { title: "ErrorState" };
export default meta;

export const Default: StoryObj = {
  render: () => <ErrorState onRetry={() => alert("retry")} />,
};

export const Retrying: StoryObj = {
  render: () => <ErrorState onRetry={() => {}} retrying />,
};
