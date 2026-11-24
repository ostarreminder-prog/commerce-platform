import type { Meta, StoryObj } from "@storybook/react";
import { Home, Package, ShoppingCart } from "lucide-react";
import { WorkspaceShell } from "../components/workspace-shell";
import { Button } from "../components/button";

const meta: Meta = { title: "WorkspaceShell" };
export default meta;

export const Default: StoryObj = {
  render: () => (
    <div className="h-96 border">
      <WorkspaceShell
        brand={<span className="font-bold">Nakhla</span>}
        navLabel="Navigation"
        openMenuLabel="Menu"
        nav={[
          { href: "/", label: "Home", icon: Home, active: true },
          { href: "/orders", label: "Orders", icon: ShoppingCart, badge: "3" },
          { href: "/products", label: "Products", icon: Package },
        ]}
        renderLink={({ href, className, children, ...rest }) => <a href={href} className={className} {...rest}>{children}</a>}
        actions={<Button size="sm">New</Button>}
      >
        <div className="p-6 text-sm">Workspace content goes here.</div>
      </WorkspaceShell>
    </div>
  ),
};
