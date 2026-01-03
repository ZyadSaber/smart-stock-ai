import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { LoadingProvider } from "@/lib/loading-context";
import { ClientContentWrapper } from "@/components/layout/client-content-wrapper";
import { SidebarProvider } from "@/lib/sidebar-context";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <LoadingProvider>
            <SidebarProvider>
                <div className="flex h-screen overflow-hidden bg-background text-foreground w-full">
                    <Sidebar />
                    <div className="flex flex-col flex-1 overflow-hidden">
                        <Header />
                        <ClientContentWrapper>
                            {children}
                        </ClientContentWrapper>
                    </div>
                </div>
            </SidebarProvider>
        </LoadingProvider>
    );
}