import { AppSidebar } from "@/components/shared/app-siderbar";

import { SearchInput } from "@/components/shared/SearchInput";

import { Button } from "@/components/ui/button";

import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

import { LogIn } from "lucide-react";

import Link from "next/link";

import { ReactNode } from "react";

type LayotProps = {
  children: ReactNode;
};

export default function Layout({ children }: LayotProps) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-17.5 shrink-0 border-b items-center px-6 justify-between gap-2">
          <div className="flex-1 flex items-center gap-4">
            <SidebarTrigger className="flex md:hidden -ml-1"/>
            <SearchInput />
          </div>

          <Link href={"/auth/sing-in"}>
            <Button size="sm">
              <LogIn />
              Entrar
            </Button>
          </Link>
        </header>

        <div className="flex-1 flex flex-col gap-6 p-6 overflow-auto ">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
