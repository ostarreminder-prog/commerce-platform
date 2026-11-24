import { BrandView } from "@/features/brands/brand-view";

export default async function BrandPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <BrandView id={id} />;
}
