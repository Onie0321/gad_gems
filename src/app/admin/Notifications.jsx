"use client";

import React, { useState, useEffect } from "react";
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
import { fetchNotifications, markNotificationAsRead } from "@/lib/appwrite";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

export default function Notifications() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserNotifications();
  }, [user]);

  const fetchUserNotifications = async () => {
    try {
      if (!user) return;

      const userNotifications = await fetchNotifications(user.$id);
      setNotifications(userNotifications);
      setUnreadCount(userNotifications.filter((n) => !n.isRead).length);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      toast({
        title: "Error",
        description: "Failed to fetch notifications",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationClick = async (notification) => {
    try {
      // Mark as read if unread
      if (!notification.isRead) {
        await handleMarkAsRead(notification.$id);
      }

      // Handle navigation based on notification type and action
      switch (notification.actionType) {
        case "user_signin":
        case "user_signout":
        case "user_registration":
        case "password_reset_request":
        case "password_reset_complete":
          // Navigate directly to the activity logs page
          router.push("/admin/user-management/activity-logs");
          break;
        case "event_creation":
        case "event_import":
          router.push(`/admin/events/event-participant-log`);
          break;
        default:
          // For other types, just show the modal
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

  const handleMarkAsRead = async (notificationId) => {
    try {
      await markNotificationAsRead(notificationId);

      setNotifications((prev) =>
        prev.map((notification) =>
          notification.$id === notificationId
            ? { ...notification, isRead: true }
            : notification
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
          .filter((n) => !n.isRead)
          .map((n) => markNotificationAsRead(n.$id))
      );
      setNotifications(notifications.map((n) => ({ ...n, isRead: true })));
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
      await markNotificationAsRead(notificationId);

      setNotifications(notifications.filter((n) => n.$id !== notificationId));
      setUnreadCount(
        (prev) =>
          notifications.filter((n) => !n.isRead && n.$id !== notificationId)
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
          markNotificationAsRead(notification.$id)
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
      case "user_signin":
      case "user_signout":
      case "user_registration":
        return "👤";
      case "event_creation":
      case "event_import":
        return "📅";
      case "password_reset_request":
      case "password_reset_complete":
        return "🔑";
      default:
        return type === "account" ? "👤" : type === "event" ? "📅" : "ℹ️";
    }
  };

  const getNotificationColor = (type, read) => {
    const baseColor =
      type === "account" ? "blue" : type === "event" ? "green" : "yellow";

    return read
      ? `bg-${baseColor}-50/50 border-${baseColor}-100`
      : `bg-${baseColor}-50 border-${baseColor}-200`;
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchUserNotifications();
    setIsRefreshing(false);
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      </div>
    );
  }

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
                className={`flex items-start p-3 cursor-pointer hover:bg-gray-100 border-l-4 ${getNotificationColor(
                  notification.type,
                  notification.isRead
                )} ${notification.isRead ? "opacity-60" : "font-medium"}`}
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
                  {!notification.isRead && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="ml-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMarkAsRead(notification.$id);
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
                {selectedNotification.additionalData && (
                  <div className="bg-gray-50 p-3 rounded-md">
                    <pre className="text-xs overflow-auto">
                      {JSON.stringify(
                        selectedNotification.additionalData,
                        null,
                        2
                      )}
                    </pre>
                  </div>
                )}
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
