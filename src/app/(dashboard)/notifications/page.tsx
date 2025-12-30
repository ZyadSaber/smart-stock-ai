import { getNotifications } from "./actions";
import { NotificationsList } from "@/components/notifications/NotificationsList";

export const metadata = {
    title: "Notifications | SmartStock AI",
    description: "View and manage your system alerts and activity history.",
};

export default async function NotificationsPage() {
    const notifications = await getNotifications();

    return (
        <div className="min-h-full bg-background/50">
            <NotificationsList initialNotifications={notifications} />
        </div>
    );
}
