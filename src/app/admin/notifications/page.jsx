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
import { databases, databaseId } from "@/lib/appwrite";
import { Query } from "appwrite";
import { toast } from "@/hooks/use-toast";

export default function Notifications() {
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
      const queries = [Query.orderDesc("$createdAt"), Query.limit(5)];
      
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

  const handleApproval = async (notificationId, eventId, approved) => {
    try {
      // Update the event's approval status
      await databases.updateDocument(
        databaseId,
        "events", // Make sure this is the correct collection name for events
        eventId,
        { approvalStatus: approved ? "approved" : "rejected" }
      );

      // Update the notification
      await databases.updateDocument(
        databaseId,
        "notifications",
        notificationId,
        { 
          read: true,
          approvalStatus: approved ? "approved" : "rejected"
        }
      );

      // Refresh notifications
      fetchNotifications();

      toast.success(`Event ${approved ? "approved" : "rejected"} successfully.`);
    } catch (error) {
      console.error("Error handling approval:", error);
      toast.error("Error updating event status. Please try again.");
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

  const getNotificationIcon = (type) => {
    switch (type) {
      case "approval":
        return "🔔";
      case "info":
        return "ℹ️";
      case "warning":
        return "⚠️";
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
      <DropdownMenuContent className="w-80">
        {notifications.length > 0 ? (
          <>
            {notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.$id}
                className={`flex items-start p-3 ${
                  notification.read ? "opacity-50" : ""
                }`}
              >
                <span className="mr-2 text-lg">
                  {getNotificationIcon(notification.type)}
                </span>
                <div className="flex-1">
                  <h4 className="font-semibold">{notification.title}</h4>
                  <p className="text-sm">{notification.message}</p>
                  {notification.actionType === "event_approval" && user.role === "admin" && (
                    <div className="mt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="mr-2"
                        onClick={() => handleApproval(notification.$id, notification.eventId, true)}
                      >
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleApproval(notification.$id, notification.eventId, false)}
                      >
                        Reject
                      </Button>
                    </div>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(notification.$createdAt).toLocaleString()}
                  </p>
                </div>
              </DropdownMenuItem>
            ))}
            <DropdownMenuItem onClick={markAllAsRead} className="text-center">
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

