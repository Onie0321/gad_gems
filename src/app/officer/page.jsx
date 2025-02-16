"use client";

import { useState, useEffect, Suspense } from "react";
import { Calendar, PieChart, Settings, Menu, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import EventsPage from "./EventManagement";
import DemographicAnalysis from "./DemographicAnalysis";
import { Notifications } from "./Notifications";
import UserMenu from "./UserMenu";
import {
  getCurrentUser,
  databases,
  databaseId,
  userCollectionId,
} from "@/lib/appwrite";
import { useRouter, useSearchParams } from "next/navigation";
import WelcomeModal from "@/components/modals/welcome";
import GADConnectSimpleLoader from "@/components/loading/simpleLoading";
import { useToast } from "@/hooks/use-toast";

// Note: Update chart colors in respective components to use a mix of Blue (#2D89EF), Teal (#4DB6AC), Coral (#FF6F61), and Violet for visual clarity.

// Create a wrapper component for the parts using useSearchParams
function OfficerDashboardContent() {
  const [activeTab, setActiveTab] = useState("event-management");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const { toast } = useToast();
  const searchParams = useSearchParams();

  const primaryButton = "bg-[#2D89EF] text-white hover:bg-[#2D89EF]/90";
  const secondaryButton = "bg-[#4DB6AC] text-white hover:bg-[#4DB6AC]/90";
  const linkColor = "text-[#FF6F61] hover:text-[#FF6F61]/80";
  const ctaArea = "bg-[#F9A825]";
  const successIndicator = "bg-[#A7FFEB]";

  useEffect(() => {
    const checkUserRole = async () => {
      try {
        const currentUser = await getCurrentUser();
        const isAdminViewing =
          sessionStorage.getItem("adminViewingOfficer") === "true";

        if (!currentUser) {
          router.replace("/sign-in");
          return;
        }

        // Check if user is admin viewing officer dashboard or is a regular user
        if (
          (currentUser.role === "admin" && isAdminViewing) ||
          currentUser.role === "user"
        ) {
          setUser(currentUser);

          // Show welcome toast if coming from login
          if (searchParams.get("login") === "success") {
            toast({
              title: "Welcome back!",
              description: `Successfully signed in as ${currentUser.name}`,
              duration: 3000,
            });
          }

          // Show first-time login modal if applicable
          if (
            currentUser.role === "user" &&
            currentUser.isFirstLogin === true
          ) {
            setShowWelcomeModal(true);
            await updateUserFirstLogin(currentUser.$id);
          }
        } else {
          router.replace("/sign-in");
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

    // Run the check
    checkUserRole();

    // Cleanup function
    return () => {
      sessionStorage.removeItem("adminViewingOfficer");
    };
  }, []);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const tabs = [
    { id: "event-management", label: "Event Management", icon: Calendar },
    {
      id: "demographic-analysis",
      label: "Demographic Analysis",
      icon: PieChart,
    },
  ];

  // Add a back to admin dashboard button if user is admin
  const BackToAdminButton = () => {
    if (user?.role === "admin") {
      return (
        <Button
          variant="ghost"
          className="ml-auto"
          onClick={() => {
            sessionStorage.removeItem("adminViewingOfficer");
            router.replace("/admin");
          }}
        >
          Back to Admin Dashboard
        </Button>
      );
    }
    return null;
  };

  const updateUserFirstLogin = async (userId) => {
    try {
      await databases.updateDocument(databaseId, userCollectionId, userId, {
        isFirstLogin: false,
      });
    } catch (error) {
      console.error("Error updating first login status:", error);
      toast({
        title: "Error",
        description: "Failed to update login status",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#4DB6AC]" />
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={`flex h-screen items-center justify-center bg-[#F5F5F5] ${linkColor}`}
      >
        {error}
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex h-screen bg-[#F5F5F5]">
      {user?.role === "admin" && (
        <div className="fixed top-0 left-0 right-0 bg-blue-500 text-white text-center py-1 text-sm">
          Viewing as Administrator
        </div>
      )}
      {/* Sidebar */}
      <aside
        className={cn(
          "bg-white shadow-md transition-all duration-300 ease-in-out",
          isSidebarOpen ? "w-64" : "w-16"
        )}
      >
        <div className="p-4 flex items-center">
          <img
            src="/logo/gad.png"
            alt="GADConnect Logo"
            className="h-8 w-8 mr-2"
          />
          {isSidebarOpen && (
            <h1 className="text-2xl font-bold text-[#37474F]">GADConnect</h1>
          )}
        </div>
        <nav className="mt-6">
          {tabs.map((tab) => (
            <Button
              key={tab.id}
              variant="ghost"
              className={cn(
                "w-full justify-start text-[#37474F]",
                !isSidebarOpen && "justify-center px-0",
                activeTab === tab.id && "bg-[#2D89EF] text-white"
              )}
              onClick={() => setActiveTab(tab.id)}
            >
              <tab.icon className="h-4 w-4" />
              {isSidebarOpen && <span className="ml-2">{tab.label}</span>}
            </Button>
          ))}
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <header className="bg-white shadow-sm">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleSidebar}
                className="mr-2"
              >
                {isSidebarOpen ? (
                  <X className="h-4 w-4" />
                ) : (
                  <Menu className="h-4 w-4" />
                )}
              </Button>
              <h2 className="text-xl font-semibold text-[#37474F]">
                {activeTab.replace("-", " ").charAt(0).toUpperCase() +
                  activeTab.replace("-", " ").slice(1)}
              </h2>
            </div>
            <div className="flex items-center space-x-4">
              <BackToAdminButton />
              <Notifications />
              <UserMenu user={user} />
            </div>
          </div>
        </header>

        <div className="p-6">
          {activeTab === "event-management" && <EventsPage user={user} />}
          {activeTab === "demographic-analysis" && <DemographicAnalysis />}
        </div>
      </main>
      {showWelcomeModal && (
        <WelcomeModal
          isOpen={showWelcomeModal}
          onClose={() => setShowWelcomeModal(false)}
          userName={user?.name}
        />
      )}
    </div>
  );
}

// Main component with Suspense boundary
export default function OfficerDashboard() {
  return (
    <Suspense
      fallback={
        <div className="h-screen w-full flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#4DB6AC]" />
        </div>
      }
    >
      <OfficerDashboardContent />
    </Suspense>
  );
}
