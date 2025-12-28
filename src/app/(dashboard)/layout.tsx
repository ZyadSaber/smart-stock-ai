import { Sidebar } from "@/components/layout/sidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex h-screen overflow-hidden bg-background text-foreground w-full">
            <Sidebar />
            <main className="flex-1 overflow-y-auto bg-muted/30 dark:bg-background overflow-x-auto">
                {children}
            </main>
        </div>
    );
}