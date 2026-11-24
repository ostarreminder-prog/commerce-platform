import { getTranslations } from "next-intl/server";
import { MfaForm } from "@/features/auth/mfa-form";

export async function generateMetadata() {
  const t = await getTranslations("mfa");
  return { title: t("title") };
}

export default function MfaPage() {
  return <MfaForm />;
}
