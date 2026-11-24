import { BackToTop } from "@/components/back-to-top";
import { CompareBar } from "@/components/compare-bar";
import { MaintenanceGate } from "@/components/maintenance-gate";
import { StoreFooter } from "@/components/store-footer";
import { StoreHeader } from "@/components/store-header";
import { SeoMeta } from "@/lib/seo-meta";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <SeoMeta />
      <MaintenanceGate>
        <StoreHeader />
        <main className="flex-1">{children}</main>
        <StoreFooter />
        <BackToTop />
        <CompareBar />
      </MaintenanceGate>
    </div>
  );
}
