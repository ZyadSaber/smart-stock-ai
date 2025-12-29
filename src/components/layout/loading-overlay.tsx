"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

export default function LoadingOverlay() {
    const [show, setShow] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setShow(true);
        }, 500);

        return () => clearTimeout(timer);
    }, []);

    if (!show) return null;

    return (
        <div className="flex h-[calc(100vh-2rem)] w-full items-center justify-center bg-background/50 backdrop-blur-sm transition-all duration-300">
            <div className="flex flex-col items-center gap-4 p-8 rounded-2xl bg-card border shadow-xl animate-in fade-in zoom-in duration-300">
                <div className="relative">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    <div className="absolute inset-0 h-10 w-10 animate-ping rounded-full bg-primary/20 blur-xl" />
                </div>
                <div className="text-center space-y-1">
                    <p className="text-lg font-semibold tracking-tight text-foreground">Fetching Data</p>
                    <p className="text-sm text-muted-foreground animate-pulse">Syncing with database...</p>
                </div>
            </div>
        </div>
    );
}
