// src/app/admin/notifications/page.jsx
"use client";

import { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/context/AuthContext";
import {
  databases,
  databaseId,
  notificationsCollectionId,
  client,
} from "@/lib/appwrite";
import { Query } from "appwrite";
import { toast } from "@/hooks/use-toast";

export default function Notifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
    try {
      if (!user) return;

      const response = await databases.listDocuments(
        databaseId,
        notificationsCollectionId,
        [Query.orderDesc("$createdAt"), Query.limit(100)]
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

      // Subscribe to real-time updates
      const unsubscribe = client.subscribe(
        `databases.${databaseId}.collections.${notificationsCollectionId}.documents`,
        (response) => {
          if (
            response.events.includes(
              "databases.*.collections.*.documents.*.create"
            )
          ) {
            // Add new notification to the list
            setNotifications((prev) => [response.payload, ...prev]);
            setUnreadCount((prev) => prev + 1);
          }
        }
      );

      return () => {
        unsubscribe();
      };
    }
  }, [user]);

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
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type?.toLowerCase()) {
      case "account":
        return "👤";
      case "event":
        return "📅";
      case "info":
        return "ℹ️";
      default:
        return "📩";
    }
  };

  return (
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
      <DropdownMenuContent className="w-80 max-h-[500px] overflow-y-auto">
        <div className="flex justify-between items-center p-2 border-b">
          <h3 className="font-semibold">Notifications</h3>
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
        </div>
        {notifications.length > 0 ? (
          notifications.map((notification) => (
            <DropdownMenuItem
              key={notification.$id}
              className={`flex items-start p-3 ${
                notification.read ? "opacity-60" : ""
              }`}
              onClick={() => !notification.read && markAsRead(notification.$id)}
            >
              <span className="mr-2 text-lg">
                {getNotificationIcon(notification.type)}
              </span>
              <div className="flex-1">
                <h4 className="font-semibold text-sm">{notification.title}</h4>
                <p className="text-sm text-gray-600">{notification.message}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(notification.$createdAt).toLocaleString()}
                </p>
              </div>
            </DropdownMenuItem>
          ))
        ) : (
          <div className="p-4 text-center text-gray-500">No notifications</div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
