import { Button } from "@/components/ui/button";
import { SidebarMenu, SidebarMenuItem } from "@/components/ui/sidebar";
import { LogIn } from "lucide-react";
import Link from "next/link";

export function NavUser() {
    return (
        <SidebarMenu>
            <SidebarMenuItem>
                <div className="p-2 ">
                    <Link href={"/auth/sign-ing"} passHref className="w-full">
                    
                    <Button size={"sm"} variant={"outline"} className="w-full">
                        <LogIn />
                        entrar
                        </Button></Link>
                </div>
            </SidebarMenuItem>
        </SidebarMenu>
    )
}