"use client";

import { ApiKeysCard } from "./api-keys-card";
import { WebhooksCard } from "./webhooks-card";

/** Developers — API keys + webhooks + deliveries log (spec §4.21). */
export function DevelopersPanel() {
  return (
    <div className="space-y-4">
      <ApiKeysCard />
      <WebhooksCard />
    </div>
  );
}
