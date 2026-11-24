import { getTranslations } from "next-intl/server";
import { AuditPanel } from "@/features/settings/audit-panel";
import { SettingsScaffold } from "@/features/settings/settings-scaffold";

export async function generateMetadata() {
  const t = await getTranslations("settings");
  return { title: `${t("nav.audit")} · ${t("title")}` };
}

export default function Page() {
  return (
    <SettingsScaffold section="audit">
      <AuditPanel />
    </SettingsScaffold>
  );
}
