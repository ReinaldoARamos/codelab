import { Separator } from "@/components/ui/separator";
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  BookOpen,
  BookUp2,
  ChartArea,
  MessageCircle,
  SquareDashedBottomCode,
  Trophy,
  Users,
} from "lucide-react";
import Link from "next/link";

type NavItem = {
  label: string;
  path: string;
  icon: React.ElementType;
};

export const NavItems = () => {
  const navItems: NavItem[] = [
    {
      label: "Cursos",
      path: "/",
      icon: SquareDashedBottomCode,
    },
    {
      label: "Meus cursos",
      path: "/my-course",
      icon: BookUp2,
    },
    {
      label: "Ranking",
      path: "/ranking",
      icon: Trophy,
    },
  ];

  const AdminNavItems: NavItem[] = [
    {
      label: "Estatisticas",
      path: "/admin",
      icon: ChartArea,
    },
    {
      label: "Gerenciar Cursos",
      path: "/admin/courses",
      icon: BookOpen,
    },
    {
      label: "Gerenciar usuarios",
      path: "/admin/users",
      icon: Users,
    },
    {
      label: "Gerenciar comentarios",
      path: "/admin/comments",
      icon: MessageCircle,
    },
  ];

  const renderNavItem = (items: NavItem[]) => {
    return items.map((item) => (
      <SidebarMenuItem key={item.label}>
        <SidebarMenuButton asChild tooltip={item.label}>
          <Link href={item.path}>
            <item.icon className="text-primary group-data-[collapsible=icon]:text-white transition-all" />
            <span>{item.label}</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    ));
  };

  return (
    <SidebarGroup>
      <SidebarMenu>
        {renderNavItem(navItems)}
        <Separator className="my-2" />{renderNavItem(AdminNavItems)}
      </SidebarMenu>
    </SidebarGroup>
  );
};
