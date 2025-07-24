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
  ImageIcon,
  Clock,
  Archive,
  Menu,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import UserMenu from "./user-menu/UserMenu";
import NotificationButton from "./Notifications";

import EventsSection from "./Events";
import DemographicAnalysis from "./Demographics";
import UserManagement from "./UserManagement";
import InactivityLock from "@/components/loading/InactivityLock";
import DataImportAnalytics from "./DataImport";
import {
  getCurrentUser,
  getAccount,
  databaseId,
  databases,
  userCollectionId,
  eventCollectionId,
  studentCollectionId,
  staffFacultyCollectionId,
  communityCollectionId,
  getCurrentAcademicPeriod,
  signOut,
} from "@/lib/appwrite";
import { Query } from "appwrite";
import { useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import HomepageSettings from "./HomepageSetting";
import { useToast } from "@/hooks/use-toast";
import AcademicPeriodManagement from "./Academic-Period";
import TimeoutWarningModal from "@/components/modals/TimeoutWarningModal";
import { Skeleton } from "@/components/ui/skeleton";
import DashboardOverview from "./Dashboard";
import { cn } from "@/lib/utils";

// Helper to fetch all documents from a collection (cursor-based pagination for >5000 records)
async function fetchAllDocuments(studentCollectionId, onProgress = null) {
  const limit = 100;
  let allDocs = [];
  let cursor = undefined;
  let hasMore = true;
  let batch = 0;

  while (hasMore) {
    try {
      const queries = [Query.limit(limit)];
      if (cursor) queries.push(Query.cursorAfter(cursor));

      const response = await databases.listDocuments(
        databaseId,
        studentCollectionId,
        queries
      );

      allDocs = allDocs.concat(response.documents);

      // Update progress if callback provided
      if (onProgress) {
        onProgress({
          collection: studentCollectionId,
          batch: batch + 1,
          documentsInBatch: response.documents.length,
          totalDocuments: allDocs.length,
        });
      }

      if (response.documents.length < limit) {
        hasMore = false;
      } else {
        cursor = response.documents[response.documents.length - 1].$id;
        batch++;
      }
    } catch (error) {
      console.error(`Error fetching batch ${batch + 1}:`, error);
      throw error;
    }
  }

  return allDocs;
}

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
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const [user, setUser] = useState(null);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [showTimeoutWarning, setShowTimeoutWarning] = useState(false);
  const [isSessionExpired, setIsSessionExpired] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const INACTIVITY_TIMEOUT = 15 * 60 * 1000; // 15 minutes
  const WARNING_DURATION = 60; // 60 seconds

  useEffect(() => {
    const checkUserRole = async () => {
      try {
        const currentUser = await getCurrentUser();
        if (!currentUser || currentUser.role !== "admin") {
          router.push("/sign-in");
        } else {
          setUser(currentUser);

          // Show welcome toast if coming from login
          if (searchParams.get("login") === "success") {
            toast({
              title: "Welcome back, Admin!",
              description: `Successfully signed in as ${currentUser.name}`,
              duration: 3000,
            });
          }

          setShowWelcomeModal(true);
        }
      } catch (err) {
        setError(
          "An error occurred while checking your access. Please try again."
        );
      } finally {
        setLoading(false);
      }
    };

    checkUserRole();
  }, []);

  useEffect(() => {
    let inactivityTimer;
    let warningTimer;

    const resetTimers = () => {
      setLastActivity(Date.now());
      setShowTimeoutWarning(false);
      clearTimeout(inactivityTimer);
      clearTimeout(warningTimer);

      // Set new timers
      inactivityTimer = setTimeout(() => {
        setShowTimeoutWarning(true);
        warningTimer = setTimeout(
          handleSessionTimeout,
          WARNING_DURATION * 1000
        );
      }, INACTIVITY_TIMEOUT - WARNING_DURATION * 1000);
    };

    // Monitor user activity
    const handleActivity = () => {
      if (!isSessionExpired && !showTimeoutWarning) {
        resetTimers();
      }
    };

    // Add event listeners for user activity
    const events = [
      "mousedown",
      "keydown",
      "touchstart",
      "mousemove",
      "scroll",
      "click",
    ];

    events.forEach((event) => {
      document.addEventListener(event, handleActivity);
    });

    // Initial timer setup
    resetTimers();

    // Cleanup
    return () => {
      events.forEach((event) => {
        document.removeEventListener(event, handleActivity);
      });
      clearTimeout(inactivityTimer);
      clearTimeout(warningTimer);
    };
  }, [isSessionExpired, showTimeoutWarning]);

  const handleSessionTimeout = async () => {
    setIsSessionExpired(true);
    setShowTimeoutWarning(false);
    try {
      await signOut();
      router.push("/sign-in");
    } catch (error) {
      console.error("Error during session timeout:", error);
    }
  };

  const handleExtendSession = () => {
    setShowTimeoutWarning(false);
    setLastActivity(Date.now());
  };

  const retryDataFetch = () => {
    setError(null);
    // The useEffect will re-run when retryCount changes
  };

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setLoading(true);

        const user = await getCurrentUser();
        const account = await getAccount();
        if (user && account) {
          setCurrentUser({ ...user, ...account });

          // Get current academic period
          const currentPeriod = await getCurrentAcademicPeriod();
          if (!currentPeriod) {
            throw new Error("No active academic period found");
          }

          // Fetch all data in parallel using cursor-based pagination
          const [
            fetchedUsers,
            fetchedStudents,
            fetchedStaffFaculty,
            fetchedCommunity,
            fetchedEvents,
          ] = await Promise.all([
            // Fetch all users (using cursor-based pagination)
            fetchAllDocuments(userCollectionId),
            // Fetch all students (using cursor-based pagination)
            fetchAllDocuments(studentCollectionId),
            // Fetch all staff/faculty (using cursor-based pagination)
            fetchAllDocuments(staffFacultyCollectionId),
            // Fetch all community members (using cursor-based pagination)
            fetchAllDocuments(communityCollectionId),
            // Fetch all events (using cursor-based pagination)
            fetchAllDocuments(eventCollectionId),
          ]);

          // Combine all participants with their respective types
          const allParticipants = [
            ...fetchedStudents.map((p) => ({
              ...p,
              participantType: "Student",
            })),
            ...fetchedStaffFaculty.map((p) => ({
              ...p,
              participantType: "Staff/Faculty",
            })),
            ...fetchedCommunity.map((p) => ({
              ...p,
              participantType: "Community Member",
            })),
          ];

          setUsers(fetchedUsers);
          setParticipants(allParticipants);
          setEvents(fetchedEvents);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setError(err.message);
        toast({
          title: "Error Loading Data",
          description: err.message,
          variant: "destructive",
        });
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
    // Calculate participant type totals
    const participantTotals = {
      students: participants.filter((p) => p.participantType === "Student")
        .length,
      staffFaculty: participants.filter(
        (p) => p.participantType === "Staff/Faculty"
      ).length,
      communityMembers: participants.filter(
        (p) => p.participantType === "Community Member"
      ).length,
    };

    const props = {
      currentUser,
      users,
      participants,
      events,
      participantTotals,
    };

    switch (activeSection) {
      case "users":
        return <UserManagement {...props} />;
      case "events":
        return <EventsSection {...props} />;
      case "demographics":
        return <DemographicAnalysis />;
      case "homepage":
        return <HomepageSettings />;
      case "academic Period":
        return <AcademicPeriodManagement />;
      
      default:
        return <DashboardOverview {...props} />;
    }
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
        {/* Sidebar Skeleton */}
        <aside className="hidden w-64 overflow-y-auto bg-white dark:bg-gray-800 md:block">
          <div className="flex h-full flex-col">
            <div className="p-5">
              <Skeleton className="h-8 w-32 mx-auto" />
            </div>
            <div className="space-y-4 p-5">
              {[...Array(7)].map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          </div>
        </aside>

        {/* Main Content Skeleton */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Top Bar Skeleton */}
          <header className="flex h-16 items-center justify-between border-b bg-white px-6 dark:border-gray-700 dark:bg-gray-800">
            <Skeleton className="h-8 w-48" />
            <div className="flex items-center space-x-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <Skeleton className="h-10 w-10 rounded-full" />
            </div>
          </header>

          {/* Main Content with Progress */}
          <main className="flex-1 overflow-y-auto p-6">
            {/* Stats Cards Skeleton */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="bg-white dark:bg-gray-800 rounded-lg border shadow-sm p-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-4 rounded" />
                  </div>
                  <Skeleton className="h-8 w-16 mb-4" />
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-3 w-16" />
                      <Skeleton className="h-5 w-12" />
                    </div>
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-3 w-20" />
                      <Skeleton className="h-5 w-12" />
                    </div>
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-3 w-16" />
                      <Skeleton className="h-5 w-12" />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Recent Events Table Skeleton */}
            <div className="mb-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg border shadow-sm p-6">
                <Skeleton className="h-6 w-32 mb-4" />
                <div className="space-y-3">
                  <div className="grid grid-cols-7 gap-4 pb-2 border-b">
                    {[...Array(7)].map((_, i) => (
                      <Skeleton key={i} className="h-4 w-full" />
                    ))}
                  </div>
                  {[...Array(5)].map((_, rowIndex) => (
                    <div key={rowIndex} className="grid grid-cols-7 gap-4 py-2">
                      {[...Array(7)].map((_, colIndex) => (
                        <Skeleton key={colIndex} className="h-4 w-full" />
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Demographic Analysis Skeleton */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border shadow-sm p-6">
              <Skeleton className="h-6 w-40 mb-4" />
              <div className="space-y-4">
                <div className="flex space-x-2 mb-4">
                  <Skeleton className="h-10 w-32" />
                  <Skeleton className="h-10 w-40" />
                </div>
                <Skeleton className="h-[300px] w-full" />
                <div className="space-y-2">
                  <div className="grid grid-cols-5 gap-4 pb-2 border-b">
                    {[...Array(5)].map((_, i) => (
                      <Skeleton key={i} className="h-4 w-full" />
                    ))}
                  </div>
                  {[...Array(6)].map((_, rowIndex) => (
                    <div key={rowIndex} className="grid grid-cols-5 gap-4 py-2">
                      {[...Array(5)].map((_, colIndex) => (
                        <Skeleton key={colIndex} className="h-4 w-full" />
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
        {/* Sidebar Skeleton */}
        <aside className="hidden w-64 overflow-y-auto bg-white dark:bg-gray-800 md:block">
          <div className="flex h-full flex-col">
            <div className="p-5">
              <Skeleton className="h-8 w-32 mx-auto" />
            </div>
            <div className="space-y-4 p-5">
              {[...Array(7)].map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Top Bar Skeleton */}
          <header className="flex h-16 items-center justify-between border-b bg-white px-6 dark:border-gray-700 dark:bg-gray-800">
            <Skeleton className="h-8 w-48" />
            <div className="flex items-center space-x-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <Skeleton className="h-10 w-10 rounded-full" />
            </div>
          </header>

          {/* Error Content */}
          <main className="flex-1 overflow-y-auto p-6">
            <div className="flex items-center justify-center min-h-[60vh]">
              <div className="text-center max-w-md">
                <div className="mb-6">
                  <div className="mx-auto h-16 w-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
                    <svg
                      className="h-8 w-8 text-red-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Failed to Load Dashboard Data
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                    {error}
                  </p>
                </div>
                <div className="space-y-3">
                  <Button
                    onClick={retryDataFetch}
                    className="w-full"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Retrying...
                      </>
                    ) : (
                      <>
                        <svg
                          className="mr-2 h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                          />
                        </svg>
                        Retry
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
        {/* Sidebar Skeleton */}
        <aside className="hidden w-64 overflow-y-auto bg-white dark:bg-gray-800 md:block">
          <div className="flex h-full flex-col">
            <div className="p-5">
              <Skeleton className="h-8 w-32 mx-auto" />
            </div>
            <div className="space-y-4 p-5">
              {[...Array(7)].map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          </div>
        </aside>

        {/* Main Content Skeleton */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Top Bar Skeleton */}
          <header className="flex h-16 items-center justify-between border-b bg-white px-6 dark:border-gray-700 dark:bg-gray-800">
            <Skeleton className="h-8 w-48" />
            <div className="flex items-center space-x-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <Skeleton className="h-10 w-10 rounded-full" />
            </div>
          </header>

          {/* Main Content Skeleton */}
          <main className="flex-1 overflow-y-auto p-6">
            {/* User Profile Skeleton */}
            <div className="mb-6">
              <Skeleton className="h-20 w-full max-w-sm rounded-lg" />
            </div>

            {/* Loading Message */}
            <div className="flex items-center justify-center">
              <Skeleton className="h-6 w-48" />
            </div>
          </main>
        </div>
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
      <TimeoutWarningModal
        isOpen={showTimeoutWarning}
        onExtendSession={handleExtendSession}
        onClose={handleSessionTimeout}
        onTimeout={handleSessionTimeout}
        warningDuration={WARNING_DURATION}
      />
      {/* Sidebar */}
      <aside
        className={cn(
          "hidden md:block bg-white dark:bg-gray-800 transition-all duration-300 ease-in-out relative",
          isSidebarOpen ? "w-64" : "w-20"
        )}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center space-x-2">
              <div className="flex-shrink-0">
                <img
                  src="/logo/gad.png"
                  alt="GAD Logo"
                  className="h-10 w-10 object-contain rounded-full"
                  style={{ aspectRatio: "1/1" }}
                />
              </div>
              {isSidebarOpen && (
                <h1 className="text-xl font-bold text-blue-600 dark:text-blue-400 whitespace-nowrap">
                  GADConnect
                </h1>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSidebar}
              className="h-8 w-8 flex-shrink-0"
            >
              {isSidebarOpen ? (
                <ChevronLeft className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          </div>
          <nav className="flex-1 space-y-2 p-4">
            <Button
              variant={activeSection === "dashboard" ? "default" : "ghost"}
              className={cn(
                "w-full justify-start",
                !isSidebarOpen && "justify-center px-2"
              )}
              onClick={() => setActiveSection("dashboard")}
            >
              <LayoutDashboard className="h-5 w-5" />
              {isSidebarOpen && <span className="ml-2">Dashboard</span>}
            </Button>
            <Button
              variant={activeSection === "users" ? "default" : "ghost"}
              className={cn(
                "w-full justify-start",
                !isSidebarOpen && "justify-center px-2"
              )}
              onClick={() => setActiveSection("users")}
            >
              <UserPlus className="h-5 w-5" />
              {isSidebarOpen && <span className="ml-2">User Management</span>}
            </Button>
            <Button
              variant={activeSection === "events" ? "default" : "ghost"}
              className={cn(
                "w-full justify-start",
                !isSidebarOpen && "justify-center px-2"
              )}
              onClick={() => setActiveSection("events")}
            >
              <Calendar className="h-5 w-5" />
              {isSidebarOpen && <span className="ml-2">Event Management</span>}
            </Button>
            <Button
              variant={activeSection === "demographics" ? "default" : "ghost"}
              className={cn(
                "w-full justify-start",
                !isSidebarOpen && "justify-center px-2"
              )}
              onClick={() => setActiveSection("demographics")}
            >
              <Users className="h-5 w-5" />
              {isSidebarOpen && <span className="ml-2">Demographics</span>}
            </Button>
            <Button
              variant={activeSection === "homepage" ? "default" : "ghost"}
              className={cn(
                "w-full justify-start",
                !isSidebarOpen && "justify-center px-2"
              )}
              onClick={() => setActiveSection("homepage")}
            >
              <ImageIcon className="h-5 w-5" />
              {isSidebarOpen && (
                <span className="ml-2">Content Management</span>
              )}
            </Button>
            <Button
              variant={
                activeSection === "academic Period" ? "default" : "ghost"
              }
              className={cn(
                "w-full justify-start",
                !isSidebarOpen && "justify-center px-2"
              )}
              onClick={() => setActiveSection("academic Period")}
            >
              <Clock className="h-5 w-5" />
              {isSidebarOpen && <span className="ml-2">Academic Period</span>}
            </Button>
            <Button
              variant={activeSection === "archives" ? "default" : "ghost"}
              className={cn(
                "w-full justify-start",
                !isSidebarOpen && "justify-center px-2"
              )}
              onClick={() => setActiveSection("archives")}
            >
              <Archive className="h-5 w-5" />
              {isSidebarOpen && <span className="ml-2">Archives</span>}
            </Button>
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="flex h-16 items-center justify-between border-b bg-white px-6 dark:border-gray-700 dark:bg-gray-800">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSidebar}
              className="md:hidden"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
              {activeSection.charAt(0).toUpperCase() + activeSection.slice(1)}
            </h2>
          </div>
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
