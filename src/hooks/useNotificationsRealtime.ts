"use client";

import { useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";
import { Notification } from "@/types/notifications";
import { useRouter } from "next/navigation";

export default function useNotificationsRealtime(
  onNewNotification?: (notification: Notification) => void
) {
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    const channel = supabase
      .channel("notifications-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
        },
        (payload) => {
          const newNotification = payload.new as Notification;

          if (onNewNotification) {
            onNewNotification(newNotification);
          }

          // Show toast
          toast(newNotification.title, {
            description: newNotification.message,
            action: {
              label: "View",
              onClick: () => router.push("/notifications"),
            },
          });

          router.refresh();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, router, onNewNotification]);
}
