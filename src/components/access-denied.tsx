import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { MoveLeft } from "lucide-react";

interface AccessDeniedProps {
    title?: string;
    description?: string;
    showHomeButton?: boolean;
}

export function AccessDenied({
    title = "Access Denied",
    description = "Only system administrators can manage users and permissions.",
    showHomeButton = false,
}: AccessDeniedProps) {
    return (
        <div className="flex h-[70vh] flex-col items-center justify-center space-y-4 text-center p-4">
            <div className="relative">
                <div className="absolute -inset-4 bg-destructive/10 blur-2xl rounded-full" />
                <ShieldAlert className="relative h-16 w-16 text-destructive opacity-50" />
            </div>
            <h2 className="text-2xl font-bold italic tracking-tight">{title}</h2>
            <p className="text-muted-foreground max-w-sm">{description}</p>
            {showHomeButton && (
                <Button asChild variant="outline" className="mt-4">
                    <Link href="/" className="flex items-center gap-2">
                        <MoveLeft className="h-4 w-4" />
                        Back to Home
                    </Link>
                </Button>
            )}
        </div>
    );
}
