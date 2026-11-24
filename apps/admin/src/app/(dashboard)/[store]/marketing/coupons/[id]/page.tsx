import { getTranslations } from "next-intl/server";
import { CouponDetail } from "@/features/marketing/coupons";

export async function generateMetadata() {
  const t = await getTranslations("marketing.coupon");
  return { title: t("title") };
}

export default function Page() {
  return <CouponDetail />;
}
