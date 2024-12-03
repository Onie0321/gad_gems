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
import { databases, databaseId } from "@/lib/appwrite";
import { Query } from "appwrite";

export function Notifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  const fetchNotifications = async () => {
    try {
      const response = await databases.listDocuments(
        databaseId,
        "notifications", // Make sure this collection exists in your Appwrite database
        [
          Query.equal("userId", user.$id),
          Query.orderDesc("$createdAt"),
          Query.limit(5),
        ]
      );
      setNotifications(response.documents);
      setUnreadCount(response.documents.filter((n) => !n.read).length);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      // Handle the error gracefully, maybe set an error state
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await databases.updateDocument(
        databaseId,
        "notifications",
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
        notifications.map((n) =>
          databases.updateDocument(databaseId, "notifications", n.$id, {
            read: true,
          })
        )
      );
      setNotifications(notifications.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 flex items-center justify-center text-white text-xs">
              {unreadCount}
            </span>
          )}
          <span className="sr-only">Notifications</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64">
        {notifications.length > 0 ? (
          <>
            {notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.$id}
                onClick={() => markAsRead(notification.$id)}
                className={notification.read ? "opacity-50" : ""}
              >
                {notification.message}
              </DropdownMenuItem>
            ))}
            <DropdownMenuItem onClick={markAllAsRead}>
              Mark all as read
            </DropdownMenuItem>
          </>
        ) : (
          <DropdownMenuItem>No new notifications</DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
