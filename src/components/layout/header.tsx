"use client";

import { NotificationBell } from "./notification-bell";
import { ThemeToggle } from "./theme-toggle";

export function Header() {
    return (
        <header className="h-16 border-b bg-card/50 backdrop-blur-md sticky top-0 z-30 flex items-center justify-end px-8 gap-4">
            <div className="flex items-center gap-2">
                <NotificationBell />
                <ThemeToggle />
            </div>
        </header>
    );
}
