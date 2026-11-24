import { getTranslations } from "next-intl/server";
import { LoginForm } from "@/features/auth/login-form";

export async function generateMetadata() {
  const t = await getTranslations("login");
  return { title: t("title") };
}

export default function LoginPage() {
  return <LoginForm />;
}
