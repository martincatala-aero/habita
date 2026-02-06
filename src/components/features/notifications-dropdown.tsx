"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Bell, ArrowRightLeft, AlertTriangle, Trophy, TrendingUp } from "lucide-react";

interface Notification {
  id: string;
  type: "transfer_request" | "transfer_accepted" | "transfer_rejected" | "task_overdue" | "achievement_unlocked" | "level_up";
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
  actionUrl?: string;
}

function getNotificationIcon(type: Notification["type"]) {
  switch (type) {
    case "transfer_request":
    case "transfer_accepted":
    case "transfer_rejected":
      return <ArrowRightLeft className="h-4 w-4" />;
    case "task_overdue":
      return <AlertTriangle className="h-4 w-4 text-red-500" />;
    case "achievement_unlocked":
      return <Trophy className="h-4 w-4 text-yellow-500" />;
    case "level_up":
      return <TrendingUp className="h-4 w-4 text-green-500" />;
    default:
      return <Bell className="h-4 w-4" />;
  }
}

function formatRelativeTime(dateString: string): string {
  const now = new Date();
  const past = new Date(dateString);
  const diffMs = now.getTime() - past.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return "ahora";
  if (diffMins < 60) return `hace ${diffMins} min`;
  if (diffHours < 24) return `hace ${diffHours}h`;
  if (diffDays === 1) return "ayer";
  if (diffDays < 7) return `hace ${diffDays} días`;
  return past.toLocaleDateString("es", { day: "numeric", month: "short" });
}

export function NotificationsDropdown() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      const response = await fetch("/api/notifications");
      if (response.ok) {
        const data = (await response.json()) as {
          notifications: Notification[];
          unreadCount: number;
        };
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
      }
    } catch {
      // Silently fail
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Poll every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center p-0 text-xs"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notificaciones
          </DialogTitle>
        </DialogHeader>
        <div className="max-h-[60vh] overflow-y-auto">
          {isLoading ? (
            <p className="py-8 text-center text-muted-foreground">Cargando...</p>
          ) : notifications.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">
              No tienes notificaciones
            </p>
          ) : (
            <div className="space-y-2">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className="rounded-lg border p-3 transition-colors hover:bg-muted/50"
                >
                  {notification.actionUrl ? (
                    <Link
                      href={notification.actionUrl}
                      onClick={() => setOpen(false)}
                      className="block"
                    >
                      <NotificationContent notification={notification} />
                    </Link>
                  ) : (
                    <NotificationContent notification={notification} />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function NotificationContent({ notification }: { notification: Notification }) {
  return (
    <div className="flex gap-3">
      <div className="mt-0.5">{getNotificationIcon(notification.type)}</div>
      <div className="flex-1">
        <p className="font-medium">{notification.title}</p>
        <p className="text-sm text-muted-foreground">{notification.message}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          {formatRelativeTime(notification.createdAt)}
        </p>
      </div>
    </div>
  );
}
