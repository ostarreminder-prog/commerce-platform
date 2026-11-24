"use client";

export type { ChatTurn, Props } from "./sim-shared";
import type { Props } from "./sim-shared";
import { Voice } from "./sim-voice";
import { WebChat } from "./sim-webchat";
import { WhatsApp } from "./sim-whatsapp";

export function Simulator(props: Props) {
  if (props.channel === "voice") return <Voice {...props} />;
  if (props.channel === "whatsapp") return <WhatsApp {...props} />;
  return <WebChat {...props} />;
}
