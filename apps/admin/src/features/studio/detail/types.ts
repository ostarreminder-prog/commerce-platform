import type { Agent } from "@repo/contracts";
import type { TreeIndex } from "../tree";

export type Patch = (fn: (a: Agent) => Agent) => void;

export interface TabProps {
  draft: Agent;
  patch: Patch;
  index: TreeIndex;
  agents: Agent[];
  readOnly: boolean;
}
