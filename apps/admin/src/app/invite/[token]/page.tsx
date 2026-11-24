import { getTranslations } from "next-intl/server";
import { InviteForm } from "@/features/auth/invite-form";

export async function generateMetadata() {
  const t = await getTranslations("invite");
  return { title: t("title") };
}

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <InviteForm token={token} />;
}
