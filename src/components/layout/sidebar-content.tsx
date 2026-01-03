"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Box } from "lucide-react";
import { useSidebar } from "@/lib/sidebar-context";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface SidebarContentProps {
    navLinks: ReactNode;
    navUser: ReactNode;
    defaultPage?: string;
}

export function SidebarContent({
    navLinks,
    navUser,
    defaultPage = "dashboard",
}: SidebarContentProps) {
    const { isCollapsed, toggleSidebar } = useSidebar();

    return (
        <aside
            className={cn(
                "relative flex flex-col h-screen border-r bg-card transition-all duration-300 ease-in-out",
                isCollapsed ? "w-20" : "w-64"
            )}
        >
            {/* Sidebar Toggle Button */}
            <Button
                variant="ghost"
                size="icon"
                className="absolute -right-4 top-10 z-50 h-8 w-8 rounded-full border bg-background shadow-md hover:bg-accent"
                onClick={toggleSidebar}
            >
                {isCollapsed ? (
                    <ChevronRight className="h-4 w-4" />
                ) : (
                    <ChevronLeft className="h-4 w-4" />
                )}
            </Button>

            {/* Header / Logo */}
            <div className={cn("p-6 flex items-center", isCollapsed && "px-4 justify-center")}>
                <Link
                    href={`/${defaultPage}`}
                    className="flex items-center gap-3 transition-all"
                >
                    <div className="bg-primary rounded-xl p-2 shadow-lg shadow-primary/20 shrink-0">
                        <Box className="h-6 w-6 text-blue-600" />
                    </div>
                    {!isCollapsed && (
                        <span className="text-xl font-bold tracking-tight text-primary truncate animate-in fade-in slide-in-from-left-2 duration-300">
                            SmartStock AI
                        </span>
                    )}
                </Link>
            </div>

            {/* Navigation Links */}
            <nav className="flex-1 px-3 overflow-y-auto space-y-1">
                {navLinks}
            </nav>

            {/* User Section */}
            <div className="mt-auto">
                {navUser}
            </div>
        </aside>
    );
}
