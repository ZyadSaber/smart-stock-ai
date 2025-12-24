"use client"
import { LayoutDashboard, Box, Warehouse, ShoppingCart, Users, Settings, Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { usePathname } from "next/navigation"

const menuItems = [
    { name: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
    { name: 'Inventory', icon: Box, href: '/inventory' },
    { name: 'Warehouses', icon: Warehouse, href: '/warehouses' },
    { name: 'Sales', icon: ShoppingCart, href: '/sales' },
    { name: 'Users', icon: Users, href: '/users' },
    { name: 'Settings', icon: Settings, href: '/settings' },
]

export function Sidebar() {
    const { theme, setTheme } = useTheme()
    const pathname = usePathname()

    return (
        <div className="w-64 border-l bg-card h-screen flex flex-col transition-colors">
            <div className="p-6">
                <h2 className="text-xl font-bold tracking-tight text-primary">SmartStock AI</h2>
            </div>

            <nav className="flex-1 space-y-1 px-3">
                {menuItems.map((item) => {
                    const isActive = pathname === item.href
                    return (
                        <Link key={item.href} href={item.href}>
                            <div className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${isActive ? 'bg-primary text-primary-foreground' : 'hover:bg-accent text-muted-foreground'
                                }`}>
                                <item.icon className="h-5 w-5" />
                                <span className="font-medium">{item.name}</span>
                            </div>
                        </Link>
                    )
                })}
            </nav>

            <div className="p-4 border-t flex justify-between items-center">
                <Button variant="ghost" size="icon" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
                    <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                    <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                </Button>
                <span className="text-xs text-muted-foreground font-mono">v1.0.0</span>
            </div>
        </div>
    )
}