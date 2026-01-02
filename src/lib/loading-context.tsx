"use client";

import React, { createContext, useContext, useTransition } from "react";


interface LoadingContextType {
    isPending: boolean;
    startTransition: (callback: () => void) => void;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export function LoadingProvider({ children }: { children: React.ReactNode }) {
    const [isPending, startTransition] = useTransition();

    return (
        <LoadingContext.Provider value={{ isPending, startTransition }}>
            {children}
        </LoadingContext.Provider>
    );
}

export function useLoading() {
    const context = useContext(LoadingContext);
    if (!context) {
        throw new Error("useLoading must be used within a LoadingProvider");
    }
    return context;
}
