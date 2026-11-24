"use client";

import * as React from "react";
import { commerce, studio, useCopilotSettings, useMe } from "@repo/api-client";
import type { CopilotContext } from "@repo/copilot";
import { usePermissions } from "@/lib/permissions";
import { useStoreRouter, useStoreSlug } from "@/lib/store-route";

/**
 * Builds the merchant CopilotContext — commerce api surface + ui side-effects.
 * Store copilot settings are attached so the engine's guards (blocked tools,
 * always-confirm) consult them per request.
 */
export function useCopilotEngineContext(activeConversationId: string): CopilotContext {
  const slug = useStoreSlug();
  const router = useStoreRouter();
  const { data: me } = useMe();
  const { data: copilotSettings } = useCopilotSettings();
  const { permissions } = usePermissions();

  return React.useMemo<CopilotContext>(
    () => ({
      actor: "merchant",
      storeId: slug,
      userName: me?.name ?? "…",
      permissions: new Set<string>(permissions),
      copilotSettings,
      conversationId: activeConversationId,
      api: {
        ...commerce,
        agents: studio,
        platform: null,
      },
      ui: {
        navigate: (route) => router.push(route),
        highlight: (selector) => {
          const el = document.querySelector(selector);
          if (!el) return;
          el.classList.add("copilot-highlight");
          window.setTimeout(() => el.classList.remove("copilot-highlight"), 3000);
        },
        openDialog: (name) => window.dispatchEvent(new CustomEvent("copilot:open-dialog", { detail: name })),
        fillForm: (formId, values) =>
          window.dispatchEvent(new CustomEvent("copilot:fill-form", { detail: { formId, values } })),
      },
    }),
    [slug, me?.name, router, copilotSettings, activeConversationId, permissions],
  );
}
