"use client";

import { CopilotInput as SharedCopilotInput } from "@repo/copilot/ui";
import { EntityRefMenu } from "./entity-ref-menu";

/** Admin composer — shared input + the commerce-backed entity mention menu (#/@//). */
export function CopilotInput({ focusOnMount = false }: { focusOnMount?: boolean }) {
  return <SharedCopilotInput focusOnMount={focusOnMount} entityMenu={(props) => <EntityRefMenu {...props} />} />;
}
