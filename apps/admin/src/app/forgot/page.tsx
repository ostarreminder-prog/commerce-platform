import { getTranslations } from "next-intl/server";
import { ForgotForm } from "@/features/auth/forgot-form";

export async function generateMetadata() {
  const t = await getTranslations("forgot");
  return { title: t("title") };
}

export default function ForgotPage() {
  return <ForgotForm />;
}
