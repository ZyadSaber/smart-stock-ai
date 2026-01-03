"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

interface SidebarContextType {
    isCollapsed: boolean;
    setIsCollapsed: (value: boolean) => void;
    toggleSidebar: () => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: React.ReactNode }) {
    const [isCollapsed, setIsCollapsed] = useState(() => {
        if (typeof window !== "undefined") {
            const saved = localStorage.getItem("sidebar-collapsed");
            return saved === "true";
        }
        return false;
    });

    // Keep localStorage in sync when state changes
    useEffect(() => {
        localStorage.setItem("sidebar-collapsed", String(isCollapsed));
    }, [isCollapsed]);

    const handleSetCollapsed = (value: boolean) => {
        setIsCollapsed(value);
    };

    const toggleSidebar = () => {
        handleSetCollapsed(!isCollapsed);
    };

    return (
        <SidebarContext.Provider
            value={{ isCollapsed, setIsCollapsed: handleSetCollapsed, toggleSidebar }}
        >
            {children}
        </SidebarContext.Provider>
    );
}

export function useSidebar() {
    const context = useContext(SidebarContext);
    if (context === undefined) {
        throw new Error("useSidebar must be used within a SidebarProvider");
    }
    return context;
}
