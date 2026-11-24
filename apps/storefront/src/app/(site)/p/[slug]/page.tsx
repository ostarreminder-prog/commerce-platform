import { ProductAlias } from "@/features/product/product-alias";

export default async function ProductAliasPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <ProductAlias slug={slug} />;
}
