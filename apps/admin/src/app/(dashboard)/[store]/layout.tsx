import { AdminShell } from "@/components/shell/admin-shell";
import { StoreGate } from "@/components/shell/store-gate";

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <StoreGate>
      <AdminShell>{children}</AdminShell>
    </StoreGate>
  );
}
