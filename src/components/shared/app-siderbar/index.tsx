import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import Link from "next/link";
import { ComponentProps } from "react";

type AppSideBarProps = ComponentProps<typeof Sidebar>;
export const AppSidebar = ({ ...props }: AppSideBarProps) => {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="py-4">
        <Link href={"/"}>
          <p>Logo</p>
        </Link>
      </SidebarHeader>
      <SidebarContent>{/*Nav itens* */}</SidebarContent>
      <SidebarFooter>{/*Nav user* */}</SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
};
