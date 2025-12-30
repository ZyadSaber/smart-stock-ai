"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Box, Warehouse, ShoppingCart, Users, ArrowRight, CreditCard } from "lucide-react"
import isObjectHasData from "@/lib/isObjectHasData"

const menuItems = [
    { name: 'Dashboard', icon: LayoutDashboard, href: 'dashboard' },
    { name: 'Inventory', icon: Box, href: 'inventory' },
    { name: 'Warehouses', icon: Warehouse, href: 'warehouses' },
    { name: 'Stock Movements', icon: ArrowRight, href: 'stock-movements' },
    { name: 'Purchases', icon: CreditCard, href: 'purchases' },
    { name: 'Sales', icon: ShoppingCart, href: 'sales' },
    { name: 'Users', icon: Users, href: 'users' },
]

export function NavLinks({ userRole }: { userRole?: Record<string, boolean> }) {
    const pathname = usePathname()

    const computedItems = isObjectHasData(userRole) ? menuItems.filter(record => userRole![record.href]) : []

    return (
        <div className="space-y-1">
            {computedItems.map((item) => {
                const isActive = pathname === `/${item.href}`
                const Icon = item.icon
                return (
                    <Link key={item.href} href={`/${item.href}`}>
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