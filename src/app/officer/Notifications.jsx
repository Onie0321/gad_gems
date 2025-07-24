"use client";

import { useState, useEffect } from "react";
import { Bell, X, Check, Trash2, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import {
  databases,
  databaseId,
  notificationsCollectionId,
} from "@/lib/appwrite";
import { Query } from "appwrite";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";

export function Notifications() {
  const { user } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchNotifications = async () => {
    try {
      if (!user) return;

      const response = await databases.listDocuments(
        databaseId,
        notificationsCollectionId,
        [
          Query.equal("userId", user.$id),
          Query.orderDesc("$createdAt"),
          Query.limit(100),
        ]
      );

      setNotifications(response.documents);
      setUnreadCount(response.documents.filter((n) => !n.read).length);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      toast({
        title: "Error",
        description: "Failed to fetch notifications",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();

      // Set up periodic polling instead of realtime
      const pollInterval = setInterval(fetchNotifications, 30000); // Poll every 30 seconds

      return () => {
        clearInterval(pollInterval);
      };
    }
  }, [user]);

  const handleNotificationClick = async (notification) => {
    try {
      // Mark as read if unread
      if (!notification.read) {
        await markAsRead(notification.$id);
      }

      // Handle navigation based on notification type and action
      switch (notification.actionType) {
        case "period_ending":
        case "period_ended":
        case "new_period_created":
          router.push("/officer/event-management");
          break;
        case "password_reset_initiated":
        case "password_reset_complete":
          // For password reset notifications, just show the modal
          break;
        default:
          break;
      }

      // Show modal with full details
      setSelectedNotification(notification);
      setIsModalOpen(true);
    } catch (error) {
      console.error("Error handling notification click:", error);
      toast({
        title: "Error",
        description: "Failed to process notification",
        variant: "destructive",
      });
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await databases.updateDocument(
        databaseId,
        notificationsCollectionId,
        notificationId,
        { read: true }
      );

      setNotifications(
        notifications.map((n) =>
          n.$id === notificationId ? { ...n, read: true } : n
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Error marking notification as read:", error);
      toast({
        title: "Error",
        description: "Failed to mark notification as read",
        variant: "destructive",
      });
    }
  };

  const markAllAsRead = async () => {
    try {
      await Promise.all(
        notifications
          .filter((n) => !n.read)
          .map((n) =>
            databases.updateDocument(
              databaseId,
              notificationsCollectionId,
              n.$id,
              { read: true }
            )
          )
      );
      setNotifications(notifications.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
      toast({
        title: "Success",
        description: "All notifications marked as read",
      });
    } catch (error) {
      console.error("Error marking all as read:", error);
      toast({
        title: "Error",
        description: "Failed to mark all notifications as read",
        variant: "destructive",
      });
    }
  };

  const deleteNotification = async (notificationId, e) => {
    e.stopPropagation();
    try {
      await databases.deleteDocument(
        databaseId,
        notificationsCollectionId,
        notificationId
      );

      setNotifications(notifications.filter((n) => n.$id !== notificationId));
      setUnreadCount(
        (prev) =>
          notifications.filter((n) => !n.read && n.$id !== notificationId)
            .length
      );

      toast({
        title: "Success",
        description: "Notification deleted",
      });
    } catch (error) {
      console.error("Error deleting notification:", error);
      toast({
        title: "Error",
        description: "Failed to delete notification",
        variant: "destructive",
      });
    }
  };

  const deleteAllNotifications = async () => {
    try {
      await Promise.all(
        notifications.map((notification) =>
          databases.deleteDocument(
            databaseId,
            notificationsCollectionId,
            notification.$id
          )
        )
      );

      setNotifications([]);
      setUnreadCount(0);

      toast({
        title: "Success",
        description: "All notifications deleted",
      });
    } catch (error) {
      console.error("Error deleting all notifications:", error);
      toast({
        title: "Error",
        description: "Failed to delete all notifications",
        variant: "destructive",
      });
    }
  };

  const getNotificationIcon = (type, actionType) => {
    switch (actionType) {
      case "period_ending":
      case "period_ended":
        return "⚠️";
      case "new_period_created":
        return "📅";
      case "password_reset_initiated":
      case "password_reset_request":
      case "password_reset_complete":
        return "🔑";
      default:
        return type === "account" ? "👤" : "ℹ️";
    }
  };

  const getNotificationColor = (type, read, actionType) => {
    // Handle password reset notifications
    if (actionType?.includes("password_reset")) {
      if (actionType === "password_reset_complete") {
        return read ? "bg-green-50/50" : "bg-green-50";
      }
      return read ? "bg-blue-50/50" : "bg-blue-50";
    }

    // Handle academic period notifications
    if (type === "academic_period") {
      switch (actionType) {
        case "period_ending":
        case "period_ended":
          return read ? "bg-red-50/50" : "bg-red-50";
        case "new_period_created":
          return read ? "bg-yellow-50/50" : "bg-yellow-50";
        default:
          return read ? "bg-blue-50/50" : "bg-blue-50";
      }
    }

    // Default colors for other types
    return read ? "bg-gray-50/50" : "bg-gray-50";
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchNotifications();
    setIsRefreshing(false);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon" className="relative">
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-red-500 flex items-center justify-center text-xs text-white">
                {unreadCount}
              </span>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-96 max-h-[500px] overflow-y-auto">
          <div className="flex justify-between items-center p-2 border-b">
            <h3 className="font-semibold">Notifications</h3>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className={`text-xs ${isRefreshing ? "opacity-50" : ""}`}
              >
                <RotateCw
                  className={`h-4 w-4 mr-1 ${
                    isRefreshing ? "animate-spin" : ""
                  }`}
                />
                Refresh
              </Button>
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={markAllAsRead}
                  className="text-xs"
                >
                  Mark all as read
                </Button>
              )}
              {notifications.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={deleteAllNotifications}
                  className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  Delete all
                </Button>
              )}
            </div>
          </div>
          {notifications.length > 0 ? (
            notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.$id}
                className={`flex items-start p-3 cursor-pointer hover:bg-gray-100 ${getNotificationColor(
                  notification.type,
                  notification.read,
                  notification.actionType
                )} ${notification.read ? "opacity-60" : "font-medium"}`}
                onClick={() => handleNotificationClick(notification)}
              >
                <span className="mr-2 text-lg">
                  {getNotificationIcon(
                    notification.type,
                    notification.actionType
                  )}
                </span>
                <div className="flex-1">
                  <h4 className="text-sm">{notification.title}</h4>
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {notification.message}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {format(new Date(notification.$createdAt), "PPp")}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {!notification.read && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="ml-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        markAsRead(notification.$id);
                      }}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={(e) => deleteNotification(notification.$id, e)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </DropdownMenuItem>
            ))
          ) : (
            <div className="p-4 text-center text-gray-500">
              No notifications
            </div>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedNotification && (
                <>
                  <span>
                    {getNotificationIcon(
                      selectedNotification.type,
                      selectedNotification.actionType
                    )}
                  </span>
                  {selectedNotification.title}
                </>
              )}
            </DialogTitle>
          </DialogHeader>
          {selectedNotification && (
            <>
              <div className="space-y-4">
                <DialogDescription className="text-sm text-gray-700">
                  {selectedNotification.message}
                </DialogDescription>
                <div className="text-xs text-gray-500">
                  Created:{" "}
                  {format(new Date(selectedNotification.$createdAt), "PPpp")}
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                  Close
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
