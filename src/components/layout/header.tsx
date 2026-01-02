import { NotificationBell } from "./notification-bell";
import { ThemeToggle } from "./theme-toggle";
import { getFullUser } from "@/lib/auth-utils";
import { TenantFilter } from "./tenant-filter";
import { getOrganizationsWithBranches } from "@/app/(dashboard)/users/actions";

export async function Header() {
    const user = await getFullUser();
    const { profile } = user || {};
    const { organizations } = profile || {}
    const { branches } = profile || {}

    const isSuperAdmin = profile?.is_super_admin

    // Fetch all organizations if super admin to enable switching
    const allOrganizations = isSuperAdmin ? await getOrganizationsWithBranches() : [];

    return (
        <header className="h-16 border-b bg-card/50 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between px-8 gap-4">
            <div className="flex items-center gap-2">
                {
                    isSuperAdmin ?
                        <div className="flex items-center gap-4">
                            <div className="text-sm font-bold text-red-600 bg-red-100/50 px-3 py-1 rounded-full border border-red-200">
                                SUPER ADMIN
                            </div>
                            <TenantFilter organizations={allOrganizations} />
                        </div>
                        :
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 px-3 py-1 bg-muted/50 rounded-full border border-border/50">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">Org</span>
                                <span className="text-sm font-medium">{organizations?.name || "N/A"}</span>
                            </div>
                            <div className="flex items-center gap-2 px-3 py-1 bg-muted/50 rounded-full border border-border/50">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">Branch</span>
                                <span className="text-sm font-medium">{branches?.name || "N/A"}</span>
                            </div>
                        </div>
                }
            </div>

            <div className="flex items-center gap-2">
                <NotificationBell />
                <ThemeToggle />
            </div>
        </header>
    );
}
