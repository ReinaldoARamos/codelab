import { Separator } from "@/components/ui/separator";
import { SidebarGroup, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
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
label: string,
path: string,
icon: React.ElementType

}
export const NavItens = () => {
  const NavItens : NavItem[] = [
    {
      label: "Cursos",
      path: "/",
      icon: SquareDashedBottomCode,
    },

    {
      label: "Meus cursos",
      path: "/my-courses",
      icon: BookUp2,
    },
    {
      label: "Ranking",
      path: "/ranking",
      icon: Trophy,
    },
  ];

  const AdminNavItens : NavItem[]= [
    {
      label: "Estatisticas",
      path: "/admin",
      icon: ChartArea,
    },
    {
      label: "Gerenciar Cursos",
      path: "/adnmin/courses",
      icon: BookOpen,
    },
    {
      label: "Gerenciar usuarios",
      path: "/admin/users",
      icon: Users,
    },
    {
      label: "Gerenciar comentarios",
      path: "/admin/comment",
      icon: MessageCircle,
    },
  ];



  const RenderNavItens = (items:NavItem[]) => {
    return  items.map((item) => (
        <SidebarMenuItem key={item.label}>
            <SidebarMenuButton asChild tooltip={item.label}>
            <Link href={item.path}>
            <item.icon className="text-primary group-data-[collapsed=icon]:text-white hover:text-primary transition-all"/>
            <span>{item.label}</span>
            </Link>
            </SidebarMenuButton>    
        </SidebarMenuItem>
    ))
  }
  return (
    <SidebarGroup>
      <SidebarMenu>
        {RenderNavItens(NavItens)}
        <Separator className="my-2"/>
         {RenderNavItens(AdminNavItens)}
      </SidebarMenu>
    </SidebarGroup>
  );
};
