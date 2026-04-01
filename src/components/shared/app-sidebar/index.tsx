import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import Link from "next/link";
import { ComponentProps } from "react";
import Logo from "@/assets/logo.svg";
import Logoicon from "@/assets/logo-icon.svg";
import { Navitems } from "./nav-items";
type AppSidebarProps = ComponentProps<typeof Sidebar>;
export const AppSidebar = ({ ...props }: AppSidebarProps) => {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="py-4">
        <Link href={"/"}>
          <Logo className="w-full max-w-37.5 mx-auto pt-3 sm:hidden group-data-[state=expanded]:block" />
          <Logoicon className="w-full max-w-5 mx-auto pt-3 hidden group-data-[state=collapsed]:block" />
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <Navitems />
      </SidebarContent>
      <SidebarFooter>{/*Navitem* */}</SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
};
