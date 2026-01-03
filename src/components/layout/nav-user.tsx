"use client"

import { useTransition } from "react"
import { ChevronsUpDown, LogOut, Settings, User } from "lucide-react"
import { logout } from "@/app/(auth)/actions"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useSidebar } from "@/lib/sidebar-context"
import { cn } from "@/lib/utils"

import { type User as SupabaseUser } from "@supabase/supabase-js"

export function NavUser({ user }: { user: SupabaseUser }) {
    const [isPending, startTransition] = useTransition()
    const { isCollapsed } = useSidebar()

    const handleLogout = () => {
        startTransition(async () => {
            await logout()
            window.location.href = "/"
        })
    }

    return (
        <div className="mt-auto border-t p-4">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <button className={cn(
                        "flex w-full items-center gap-3 rounded-lg p-2 text-left hover:bg-accent transition-all outline-none",
                        isCollapsed && "justify-center p-0 h-10 w-10 mx-auto"
                    )}>
                        <Avatar className="h-9 w-9 border shrink-0">
                            <AvatarImage src={user?.user_metadata?.avatar_url} />
                            <AvatarFallback className="bg-primary/10 text-primary">
                                {user?.email?.charAt(0).toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        {!isCollapsed && (
                            <>
                                <div className="flex-1 overflow-hidden animate-in fade-in slide-in-from-left-1 duration-300">
                                    <p className="text-sm font-medium truncate">{user?.email?.split('@')[0]}</p>
                                    <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                                </div>
                                <ChevronsUpDown className="h-4 w-4 text-muted-foreground shrink-0" />
                            </>
                        )}
                    </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align={isCollapsed ? "center" : "end"} side={isCollapsed ? "right" : "top"} sideOffset={10}>
                    <DropdownMenuLabel className="font-normal">
                        <div className="flex flex-col space-y-1">
                            <p className="text-sm font-medium leading-none">My Account</p>
                            <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                        </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuGroup>
                        <DropdownMenuItem className="cursor-pointer">
                            <User className="mr-2 h-4 w-4" /> Profile
                        </DropdownMenuItem>
                        <DropdownMenuItem className="cursor-pointer">
                            <Settings className="mr-2 h-4 w-4" /> Settings
                        </DropdownMenuItem>
                    </DropdownMenuGroup>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="text-destructive cursor-pointer focus:bg-destructive focus:text-destructive-foreground">
                        <LogOut className="mr-2 h-4 w-4" /> {isPending ? "Logging out..." : "Log out"}
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    )
}