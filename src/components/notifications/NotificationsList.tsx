"use client";

import { useState, useTransition } from "react";
import {
    Bell,
    Check,
    CheckCheck,
    AlertTriangle,
    PartyPopper,
    Info,
    Calendar,
    Clock,
    Search
} from "lucide-react";
import { format } from "date-fns";
import { Notification } from "@/types/notifications";
import { markAsReadAction, markAllAsReadAction } from "@/app/(dashboard)/notifications/actions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface NotificationsListProps {
    initialNotifications: Notification[];
}

export function NotificationsList({ initialNotifications }: NotificationsListProps) {
    const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);
    const [search, setSearch] = useState("");
    const [isPending, startTransition] = useTransition();

    const filteredNotifications = notifications.filter(n =>
        n.title.toLowerCase().includes(search.toLowerCase()) ||
        n.message.toLowerCase().includes(search.toLowerCase())
    );

    const handleMarkAsRead = async (id: string) => {
        const result = await markAsReadAction(id);
        if (result.error) {
            toast.error(result.error);
        } else {
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
        }
    };

    const handleMarkAllRead = async () => {
        startTransition(async () => {
            const result = await markAllAsReadAction();
            if (result.error) {
                toast.error(result.error);
            } else {
                setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
                toast.success("All notifications marked as read");
            }
        });
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'low_stock': return <AlertTriangle className="h-5 w-5 text-destructive" />;
            case 'big_sale': return <PartyPopper className="h-5 w-5 text-emerald-500" />;
            default: return <Info className="h-5 w-5 text-blue-500" />;
        }
    };

    const getTypeStyles = (type: string, isRead: boolean) => {
        const base = "border-l-4 transition-all duration-200 ";
        if (isRead) return base + "border-l-muted opacity-70 bg-card";

        switch (type) {
            case 'low_stock': return base + "border-l-destructive bg-destructive/5 shadow-sm";
            case 'big_sale': return base + "border-l-emerald-500 bg-emerald-500/5 shadow-sm";
            default: return base + "border-l-blue-500 bg-blue-500/5 shadow-sm";
        }
    };

    return (
        <div className="space-y-6 max-w-4xl mx-auto py-8 px-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight mb-1">Notification Center</h1>
                    <p className="text-muted-foreground">Manage your system alerts and activity history</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleMarkAllRead}
                        disabled={isPending || !notifications.some(n => !n.is_read)}
                        className="bg-background"
                    >
                        <CheckCheck className="h-4 w-4 mr-2" />
                        Mark all as read
                    </Button>
                </div>
            </div>

            <Card className="bg-card/50 backdrop-blur-sm border-primary/5">
                <CardContent className="p-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search notifications..."
                            className="pl-10 h-11 bg-background/50"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </CardContent>
            </Card>

            <div className="space-y-3">
                {filteredNotifications.length === 0 ? (
                    <div className="text-center py-20 bg-card/30 rounded-xl border border-dashed flex flex-col items-center gap-4">
                        <div className="bg-muted p-4 rounded-full">
                            <Bell className="h-8 w-8 text-muted-foreground opacity-50" />
                        </div>
                        <div className="space-y-1">
                            <p className="font-medium">No results found</p>
                            <p className="text-sm text-muted-foreground">Try adjusting your search criteria</p>
                        </div>
                    </div>
                ) : (
                    filteredNotifications.map((n) => (
                        <div
                            key={n.id}
                            className={`group relative rounded-xl border overflow-hidden ${getTypeStyles(n.type, n.is_read)}`}
                        >
                            <div className="flex items-start gap-4 p-5">
                                <div className="mt-1 shrink-0 p-2 rounded-lg bg-background/50 border shadow-sm">
                                    {getTypeIcon(n.type)}
                                </div>

                                <div className="flex-1 space-y-2">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                        <div className="flex items-center gap-3">
                                            <h3 className={`text-base leading-none ${!n.is_read ? 'font-bold' : 'font-semibold text-muted-foreground'}`}>
                                                {n.title}
                                            </h3>
                                            {!n.is_read && (
                                                <Badge variant="default" className="h-5 px-1.5 text-[10px] uppercase tracking-wider">New</Badge>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-3 text-[11px] text-muted-foreground font-medium opacity-70">
                                            <span className="flex items-center gap-1">
                                                <Calendar className="h-3 w-3" />
                                                {format(new Date(n.created_at), 'MMM dd, yyyy')}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Clock className="h-3 w-3" />
                                                {format(new Date(n.created_at), 'hh:mm a')}
                                            </span>
                                        </div>
                                    </div>

                                    <p className={`text-sm leading-relaxed ${!n.is_read ? 'text-foreground/90' : 'text-muted-foreground'}`}>
                                        {n.message}
                                    </p>
                                </div>

                                {!n.is_read && (
                                    <div className="shrink-0 flex items-center">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-10 w-10 rounded-full hover:bg-primary/10 text-primary transition-all scale-90 hover:scale-100"
                                            onClick={() => handleMarkAsRead(n.id)}
                                            title="Mark as read"
                                        >
                                            <Check className="h-5 w-5" />
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
