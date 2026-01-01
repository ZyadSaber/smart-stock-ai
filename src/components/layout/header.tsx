import { NotificationBell } from "./notification-bell";
import { ThemeToggle } from "./theme-toggle";
import { getFullUser } from "@/lib/auth-utils";

export async function Header() {
    const user = await getFullUser();
    const { profile } = user || {};
    const { organizations } = profile || {}
    const { branches } = profile || {}

    const isSuperAdmin = profile?.is_super_admin

    return (
        <header className="h-16 border-b bg-card/50 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between px-8 gap-4">
            <div className="flex items-center gap-2">
                {
                    isSuperAdmin ?
                        <div className="text-lg font-semibold text-red-600">
                            Super Admin Baby 😜😜
                        </div>
                        :
                        <>
                            <div className="flex items-center gap-2">
                                <span className="text-muted-foreground">Organization:</span>
                                <span className="font-semibold">{organizations?.name || ""}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-muted-foreground">Branch:</span>
                                <span className="font-semibold">{branches?.name || ""}</span>
                            </div>
                        </>
                }
            </div>
            <div className="flex items-center gap-2">
                <NotificationBell />
                <ThemeToggle />
            </div>
        </header>
    );
}
