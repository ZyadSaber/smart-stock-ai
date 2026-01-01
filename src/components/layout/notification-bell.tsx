"use client";

import { useEffect, useState, useTransition, useCallback } from "react";
import { Bell, Check, Loader2, Info, AlertTriangle, PartyPopper } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Notification } from "@/types/notifications";
import { getNotifications, markAsReadAction, markAllAsReadAction } from "@/app/(dashboard)/notifications/actions";
import { useNotificationsRealtime } from "@/hooks";
import { formatDistanceToNow } from "date-fns";
import { useRouter } from "next/navigation";

export function NotificationBell() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isPending, startTransition] = useTransition();
    const router = useRouter();
    const unreadCount = notifications.filter(n => !n.is_read).length;

    const fetchNotifications = useCallback(async () => {
        const data = await getNotifications();
        setNotifications(data);
    }, []);

    // Initialize real-time listener with a callback to update state immediately
    useNotificationsRealtime(useCallback((newNotification: Notification) => {
        setNotifications(prev => [newNotification, ...prev].slice(0, 20));
    }, []));

    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    const handleMarkAsRead = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        await markAsReadAction(id);
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
        router.refresh();
    };

    const handleMarkAllRead = async () => {
        startTransition(async () => {
            await markAllAsReadAction();
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
            router.refresh();
        });
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'low_stock': return <AlertTriangle className="h-4 w-4 text-destructive" />;
            case 'big_sale': return <PartyPopper className="h-4 w-4 text-emerald-500" />;
            default: return <Info className="h-4 w-4 text-blue-500" />;
        }
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'low_stock': return 'border-l-destructive';
            case 'big_sale': return 'border-l-emerald-500';
            default: return 'border-l-blue-500';
        }
    };

    return (
        <DropdownMenu onOpenChange={(open) => open && fetchNotifications()}>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative hover:bg-primary/5 transition-colors">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <Badge
                            variant="destructive"
                            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px] animate-in zoom-in"
                        >
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </Badge>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[380px] p-0 shadow-2xl border-primary/10 overflow-hidden">
                <DropdownMenuLabel className="p-4 flex items-center justify-between bg-muted/30">
                    <div className="flex flex-col">
                        <span className="font-bold text-lg">Notifications</span>
                        <p className="text-[10px] text-muted-foreground font-normal">Stay updated with stock and sales</p>
                    </div>
                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs h-7 text-primary hover:text-primary hover:bg-primary/5"
                            onClick={handleMarkAllRead}
                            disabled={isPending}
                        >
                            {isPending ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Check className="h-3 w-3 mr-1" />}
                            Mark all read
                        </Button>
                    )}
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="m-0" />
                <div className="max-h-[450px] overflow-y-auto">
                    {notifications.length === 0 ? (
                        <div className="p-10 text-center space-y-2">
                            <div className="bg-muted w-10 h-10 rounded-full flex items-center justify-center mx-auto opacity-50">
                                <Bell className="h-5 w-5" />
                            </div>
                            <p className="text-sm text-muted-foreground italic">No notifications yet</p>
                        </div>
                    ) : (
                        <div className="flex flex-col">
                            {notifications.map((n) => (
                                <div
                                    key={n.id}
                                    className={`relative cursor-default hover:bg-accent/50 transition-colors ${!n.is_read ? 'bg-primary/5' : ''}`}
                                >
                                    <div className={`flex items-start gap-3 p-4 w-full border-l-4 transition-all ${getTypeColor(n.type)}`}>
                                        <div className="mt-1 shrink-0">
                                            {getTypeIcon(n.type)}
                                        </div>
                                        <div className="flex-1 space-y-1">
                                            <div className="flex items-center justify-between gap-2">
                                                <h4 className={`text-sm ${!n.is_read ? 'font-bold' : 'font-semibold'}`}>{n.title}</h4>
                                                <span className="text-[10px] text-muted-foreground whitespace-nowrap opacity-70">
                                                    {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                                                </span>
                                            </div>
                                            <p className="text-xs text-muted-foreground leading-relaxed">
                                                {n.message}
                                            </p>
                                        </div>
                                        {!n.is_read && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6 rounded-full hover:bg-primary/10 shrink-0"
                                                onClick={(e) => handleMarkAsRead(n.id, e)}
                                            >
                                                <div className="h-2 w-2 rounded-full bg-primary" />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                <DropdownMenuSeparator className="m-0" />
                <div className="p-2 bg-muted/10 text-center">
                    <Button variant="link" size="sm" className="text-[10px] text-muted-foreground h-auto p-0" onClick={() => router.push('/notifications')}>
                        View all notification history
                    </Button>
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
