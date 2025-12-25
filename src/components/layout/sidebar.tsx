import { LayoutDashboard, Box, Warehouse, ShoppingCart, Users, Settings } from "lucide-react"
import { createClient } from "@/utils/supabase/server"
import { NavLinks } from "./nav-links"
import { NavUser } from "./nav-user"
import { ThemeToggle } from "./theme-toggle"

export async function Sidebar() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

    const userRole = profile?.role || 'cashier'

    console.log(userRole)

    return (
        <aside className="w-64 border-r bg-card h-screen flex flex-col transition-colors">
            <div className="p-6">
                <h2 className="text-xl font-bold tracking-tight text-primary">SmartStock AI</h2>
            </div>

            <nav className="flex-1 px-3 overflow-y-auto">
                {/* بنبعت الـ role بس والـ NavLinks هي اللي هتفلتر */}
                <NavLinks userRole={userRole} />
            </nav>

            <div className="p-4 border-t space-y-4">
                <div className="flex items-center justify-between px-2">
                    <ThemeToggle />
                </div>
                <NavUser user={{ ...user, profile }} />
            </div>
        </aside>
    )
}

// export async function Sidebar() {
//     const supabase = await createClient()
//     const { data: { user } } = await supabase.auth.getUser()


//     const menuItems = [
//         { name: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
//         { name: 'Inventory', icon: Box, href: '/inventory' },
//         { name: 'Warehouses', icon: Warehouse, href: '/warehouses' },
//         { name: 'Sales', icon: ShoppingCart, href: '/sales' },
//         { name: 'Users', icon: Users, href: '/users' },
//         { name: 'Settings', icon: Settings, href: '/settings' },
//     ]

//     return (
//         <aside className="w-64 border-r bg-card h-screen flex flex-col transition-colors">
//             <div className="p-6">
//                 <h2 className="text-xl font-bold tracking-tight text-primary">SmartStock AI</h2>
//             </div>

//             <nav className="flex-1 px-3">
//                 <NavLinks items={menuItems} />
//             </nav>

//             <div className="p-4 border-t space-y-4">
//                 <div className="flex items-center justify-between">
//                     <ThemeToggle />
//                     <span className="text-[10px] text-muted-foreground font-mono">v1.0.0</span>
//                 </div>
//                 <NavUser user={user} />
//             </div>
//         </aside>
//     )
// }