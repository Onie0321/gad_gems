// src/app/admin/notifications/page.jsx
"use client";

import { useState, useEffect } from "react";
import { Bell } from 'lucide-react';
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/context/AuthContext";
import { databases, databaseId, client } from "@/lib/appwrite";
import { Query, ID } from "appwrite";
import { toast } from "@/hooks/use-toast";

export default function Notifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user) {
      fetchNotifications();
      subscribeToNotifications();
    }
  }, [user]);

  // Subscribe to real-time notifications
  const subscribeToNotifications = () => {
    const unsubscribe = client.subscribe(`databases.${databaseId}.collections.notifications.documents`, (response) => {
      if (response.events.includes('databases.*.collections.*.documents.*.create')) {
        // Add new notification to the list
        const newNotification = response.payload;
        if (shouldShowNotification(newNotification)) {
          setNotifications(prev => [newNotification, ...prev]);
          setUnreadCount(prev => prev + 1);
          showToastNotification(newNotification);
        }
      }
    });

    return () => {
      unsubscribe();
    };
  };

  const shouldShowNotification = (notification) => {
    if (user.role === "admin") {
      return notification.type === "approval" || notification.type === "info";
    }
    return notification.userId === user.$id;
  };

  const showToastNotification = (notification) => {
    toast({
      title: notification.title,
      description: notification.message,
      duration: 5000,
    });
  };

  const fetchNotifications = async () => {
    try {
      const queries = [Query.orderDesc("$createdAt"), Query.limit(10)];
      
      if (user.role === "admin") {
        queries.push(Query.or(
          Query.equal("type", "approval"),
          Query.equal("type", "info")
        ));
      } else {
        queries.push(Query.equal("userId", user.$id));
      }

      const response = await databases.listDocuments(
        databaseId,
        "notifications",
        queries
      );
      setNotifications(response.documents);
      setUnreadCount(response.documents.filter((n) => !n.read).length);
    } catch (error) {
      console.error("Error fetching notifications:", error);
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
        notifications
          .filter(n => !n.read)
          .map((n) =>
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

  const getNotificationIcon = (type) => {
    switch (type) {
      case "approval":
        return "🔔";
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
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 flex items-center justify-center text-white text-xs">
              {unreadCount}
            </span>
          )}
          <span className="sr-only">Notifications</span>
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
                notification.read ? "opacity-50" : ""
              }`}
              onClick={() => !notification.read && markAsRead(notification.$id)}
            >
              <span className="mr-2 text-lg">
                {getNotificationIcon(notification.type)}
              </span>
              <div className="flex-1">
                <h4 className="font-semibold">{notification.title}</h4>
                <p className="text-sm">{notification.message}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(notification.$createdAt).toLocaleString()}
                </p>
              </div>
            </DropdownMenuItem>
          ))
        ) : (
          <DropdownMenuItem disabled>No notifications</DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}