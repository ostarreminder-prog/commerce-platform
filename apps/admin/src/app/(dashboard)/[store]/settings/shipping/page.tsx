import { getTranslations } from "next-intl/server";
import { ShippingPanel } from "@/features/settings/shipping-panel";
import { SettingsScaffold } from "@/features/settings/settings-scaffold";

export async function generateMetadata() {
  const t = await getTranslations("settings");
  return { title: `${t("nav.shipping")} · ${t("title")}` };
}

export default function Page() {
  return (
    <SettingsScaffold section="shipping">
      <ShippingPanel />
    </SettingsScaffold>
  );
}
