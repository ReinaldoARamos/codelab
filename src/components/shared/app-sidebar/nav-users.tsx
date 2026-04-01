import { Button } from "@/components/ui/button"
import { SidebarMenu, SidebarMenuItem } from "@/components/ui/sidebar"
import { LogIn } from "lucide-react"
import Link from "next/link"

export const NavUser = () => {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <div className="p-2">
          <Link href="/auth/sign-in" className="w-full">
            <Button
              size="sm"
              variant="outline"
              className="w-full flex items-center justify-center gap-2"
            >
              <LogIn />

              <span className="group-data-[state=collapsed]:hidden ">
                Entrar
              </span>
            </Button>
          </Link>
        </div>
      </SidebarMenuItem>
    </SidebarMenu>
  );
};