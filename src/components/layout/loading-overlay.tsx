"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

export default function LoadingOverlay({
    immediate = false,
    absolute = false
}: {
    immediate?: boolean;
    absolute?: boolean;
}) {
    const [show, setShow] = useState(immediate);

    useEffect(() => {
        if (immediate) return;
        const timer = setTimeout(() => {
            setShow(true);
        }, 500);

        return () => clearTimeout(timer);
    }, [immediate]);


    if (!show) return null;

    const containerClasses = absolute
        ? "absolute inset-0 z-[50] items-center justify-center bg-background/40 backdrop-blur-2xl transition-all duration-300 flex"
        : "fixed inset-0 z-[9999] items-center justify-center bg-background/40 backdrop-blur-2xl transition-all duration-300 flex";

    return (
        <div className={containerClasses}>
            <div className="flex flex-col items-center gap-6 p-10 rounded-3xl bg-card/80 border border-white/10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] animate-in fade-in zoom-in duration-500 backdrop-blur-md">
                <div className="relative group">
                    <div className="absolute inset-0 h-14 w-14 animate-ping rounded-full bg-primary/20 blur-2xl" />
                    <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                </div>
                <div className="text-center space-y-2">
                    <p className="text-xl font-bold tracking-tight text-foreground bg-linear-to-br from-foreground to-foreground/60 bg-clip-text">Updating Workspace</p>

                    <p className="text-sm font-medium text-muted-foreground/80 animate-pulse">Switching context...</p>
                </div>
            </div>
        </div>
    );
}

