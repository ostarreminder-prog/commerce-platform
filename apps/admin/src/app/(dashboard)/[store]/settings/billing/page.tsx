import { getTranslations } from "next-intl/server";
import { BillingPanel } from "@/features/settings/billing-panel";
import { SettingsScaffold } from "@/features/settings/settings-scaffold";

export async function generateMetadata() {
  const t = await getTranslations("settings");
  return { title: `${t("nav.billing")} · ${t("title")}` };
}

export default function Page() {
  return (
    <SettingsScaffold section="billing">
      <BillingPanel />
    </SettingsScaffold>
  );
}
