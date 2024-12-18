"use client";

import * as React from "react";
import {
  Calendar,
  FileText,
  LayoutDashboard,
  MessageSquare,
  Settings,
  Users,
  FileQuestion,
  UserPlus,
  BarChart2,
  Loader2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import UserMenu from "./user-menu/page";
import NotificationButton from "./notifications/page";
import DashboardOverview from "./dashboard/page";
import EventsSection from "./events/page";
import DemographicAnalysis from "./demographics/page";
import UserManagement from "./user-management/page";
import InactivityLock from "@/components/loading/InactivityLock";
import DataImportAnalytics from "./data-import/page";
import {
  getCurrentUser,
  getAccount,
  databaseId,
  databases,
  userCollectionId,
  eventCollectionId,
  participantCollectionId,
} from "@/lib/appwrite";
import { Query } from "appwrite";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function AdminDashboard() {
  const [activeSection, setActiveSection] = React.useState("dashboard");
  const [isLocked, setIsLocked] = React.useState(false);
  const [inactivityTimeout, setInactivityTimeout] = React.useState(
    10000 * 1000
  ); // 10000 seconds
  const [lastActivity, setLastActivity] = React.useState(Date.now());
  const [currentUser, setCurrentUser] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [users, setUsers] = React.useState([]);
  const [participants, setParticipants] = React.useState([]);
  const [events, setEvents] = React.useState([]);
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);

  useEffect(() => {
    const checkUserRole = async () => {
      try {
        const currentUser = await getCurrentUser();
        if (!currentUser || currentUser.role !== "admin") {
          // Redirect non-users to the login page
          router.push("/sign-in");
        } else {
          setUser(currentUser);
          setShowWelcomeModal(true);
        }
      } catch (err) {
        console.error("Error checking user role:", err);
        setError(
          "An error occurred while checking your access. Please try again."
        );
      } finally {
        setLoading(false);
      }
    };

    checkUserRole();
  }, [router]);

  const handleActivity = React.useCallback(() => {
    setLastActivity(Date.now());
    if (isLocked) {
      return;
    }
  }, [isLocked]);

  React.useEffect(() => {
    const events = ["mousedown", "keydown", "touchstart", "scroll"];
    events.forEach((event) => document.addEventListener(event, handleActivity));

    return () => {
      events.forEach((event) =>
        document.removeEventListener(event, handleActivity)
      );
    };
  }, [handleActivity]);

  React.useEffect(() => {
    const checkInactivity = setInterval(() => {
      if (Date.now() - lastActivity > inactivityTimeout && !isLocked) {
        setIsLocked(true);
      }
    }, 1000);

    return () => clearInterval(checkInactivity);
  }, [lastActivity, inactivityTimeout, isLocked]);

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setLoading(true);
        const user = await getCurrentUser();
        const account = await getAccount();
        if (user && account) {
          setCurrentUser({ ...user, ...account });

          // Fetch all data in parallel
          const [fetchedUsers, fetchedParticipants, fetchedEvents] =
            await Promise.all([
              databases.listDocuments(databaseId, userCollectionId, [
                Query.limit(100),
              ]),
              databases.listDocuments(databaseId, participantCollectionId, [
                Query.limit(100),
              ]),
              databases.listDocuments(databaseId, eventCollectionId, [
                Query.limit(100),
              ]),
            ]);

          setUsers(fetchedUsers.documents);
          setParticipants(fetchedParticipants.documents);
          setEvents(fetchedEvents.documents);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, []);

  const handleUnlock = () => {
    setIsLocked(false);
    setLastActivity(Date.now());
  };

  const renderActiveSection = () => {
    const props = {
      currentUser,
      users,
      participants,
      events,
    };

    switch (activeSection) {
      case "users":
        return <UserManagement {...props} />;
      case "events":
        return <EventsSection {...props} />;

      case "demographics":
        return <DemographicAnalysis />;
      default:
        return <DashboardOverview {...props} />;
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen flex-col items-center justify-center">
        <h1 className="text-2xl font-bold text-red-600">Error</h1>
        <p className="mt-2 text-gray-600">{error}</p>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="flex h-screen flex-col items-center justify-center">
       <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      <InactivityLock
        isLocked={isLocked}
        onUnlock={handleUnlock}
        inactivityTimeout={inactivityTimeout}
        setInactivityTimeout={setInactivityTimeout}
      />
      {/* Sidebar */}
      <aside className="hidden w-64 overflow-y-auto bg-white dark:bg-gray-800 md:block">
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-center p-5">
            <h1 className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              GADConnect
            </h1>
          </div>
          <nav className="flex-1 space-y-2 p-5">
            <Button
              variant={activeSection === "dashboard" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveSection("dashboard")}
            >
              <LayoutDashboard className="mr-2 h-4 w-4" />
              Dashboard
            </Button>
            <Button
              variant={activeSection === "users" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveSection("users")}
            >
              <UserPlus className="mr-2 h-4 w-4" />
              User Management
            </Button>
            <Button
              variant={activeSection === "events" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveSection("events")}
            >
              <Calendar className="mr-2 h-4 w-4" />
              Event Management
            </Button>
            <Button
              variant={activeSection === "demographics" ? "default" : "ghost"}
              className="w-full justify-start mb-2"
              onClick={() => setActiveSection("demographics")}
            >
              <Users className="mr-2 h-4 w-4" />
              Demographics
            </Button>
          </nav>
        </div>
      </aside>
      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="flex h-16 items-center justify-between border-b bg-white px-6 dark:border-gray-700 dark:bg-gray-800">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
            {activeSection.charAt(0).toUpperCase() + activeSection.slice(1)}
          </h2>
          <div className="flex items-center space-x-4">
            <NotificationButton notifications={[]} />
            <UserMenu currentUser={currentUser} />
          </div>
        </header>
        {/* Dashboard Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {renderActiveSection()}
        </main>
      </div>
    </div>
  );
}
