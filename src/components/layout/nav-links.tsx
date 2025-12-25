"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Box, Warehouse, ShoppingCart, Users, Settings } from "lucide-react"

const menuItems = [
    { name: 'Dashboard', icon: LayoutDashboard, href: '/dashboard', roles: ['admin', 'manager', 'cashier'] },
    { name: 'Inventory', icon: Box, href: '/inventory', roles: ['admin', 'manager', 'cashier'] },
    { name: 'Warehouses', icon: Warehouse, href: '/warehouses', roles: ['admin', 'manager'] },
    { name: 'Sales', icon: ShoppingCart, href: '/sales', roles: ['admin', 'manager', 'cashier'] },
    { name: 'Users', icon: Users, href: '/users', roles: ['admin'] },
    { name: 'Settings', icon: Settings, href: '/settings', roles: ['admin'] },
]

export function NavLinks({ userRole }: { userRole: string }) {
    const pathname = usePathname()

    // الفلترة بتحصل هنا في الكلاينت بناءً على الـ Role اللي جاي من السيرفر
    const filteredMenu = menuItems.filter(item => item.roles.includes(userRole))

    return (
        <div className="space-y-1">
            {filteredMenu.map((item) => {
                const isActive = pathname === item.href
                const Icon = item.icon
                return (
                    <Link key={item.href} href={item.href}>
                        <div className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${isActive ? 'bg-primary text-primary-foreground shadow-sm' : 'hover:bg-accent text-muted-foreground'
                            }`}>
                            <Icon className="h-5 w-5" />
                            <span className="font-medium text-sm">{item.name}</span>
                        </div>
                    </Link>
                )
            })}
        </div>
    )
}