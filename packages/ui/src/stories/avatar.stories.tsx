import type { Meta, StoryObj } from "@storybook/react";
import { Avatar, AvatarFallback, AvatarImage } from "../components/avatar";

const meta: Meta = { title: "Avatar" };
export default meta;

export const Fallback: StoryObj = {
  render: () => (
    <div className="flex items-center gap-3 p-6">
      <Avatar><AvatarFallback>SA</AvatarFallback></Avatar>
      <Avatar><AvatarFallback>NK</AvatarFallback></Avatar>
      <Avatar className="size-12"><AvatarFallback>MK</AvatarFallback></Avatar>
    </div>
  ),
};

export const WithImage: StoryObj = {
  render: () => (
    <Avatar>
      <AvatarImage src="https://i.pravatar.cc/96?img=12" alt="Sara" />
      <AvatarFallback>SA</AvatarFallback>
    </Avatar>
  ),
};
