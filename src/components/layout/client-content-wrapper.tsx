"use client";

import { useLoading } from "@/lib/loading-context";
import LoadingOverlay from "./loading-overlay";

export function ClientContentWrapper({ children }: { children: React.ReactNode }) {
    const { isPending } = useLoading();

    return (
        <main className="flex-1 overflow-y-auto bg-muted/30 dark:bg-background overflow-x-auto relative">
            {isPending && <LoadingOverlay immediate absolute />}
            {children}
        </main>
    );
}
