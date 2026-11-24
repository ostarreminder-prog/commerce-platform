import { getTranslations } from "next-intl/server";
import { PaymentsPanel } from "@/features/settings/payments-panel";
import { SettingsScaffold } from "@/features/settings/settings-scaffold";

export async function generateMetadata() {
  const t = await getTranslations("settings");
  return { title: `${t("nav.payments")} · ${t("title")}` };
}

export default function Page() {
  return (
    <SettingsScaffold section="payments">
      <PaymentsPanel />
    </SettingsScaffold>
  );
}
