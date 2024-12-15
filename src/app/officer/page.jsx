"use client";

import { useState, useEffect } from "react";
import { Calendar, PieChart, Settings, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import EventManagement from "./event-management/page";
import DemographicAnalysis from "./demographic-analysis/page";
import { Notifications } from "./notifications/page";
import UserMenu from "./user-menu/page";

import { getCurrentUser } from "@/lib/appwrite";
import { useRouter } from "next/navigation";
import WelcomeModal from "@/components/modals/welcome";
import SettingsSection from "./settings/page";

export default function OfficerDashboard() {
  const [activeTab, setActiveTab] = useState("event-management");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);

  useEffect(() => {
    const checkUserRole = async () => {
      try {
        const currentUser = await getCurrentUser();
        if (!currentUser || currentUser.role !== "user") {
          // Redirect non-users to the login page
          router.push("/sign-in");
        } else {
          setUser(currentUser);
          if (currentUser.isFirstLogin === true) {
            setShowWelcomeModal(true);
            // Update the user's first login status
            await updateUserFirstLogin(currentUser.$id);
          }
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

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const tabs = [
    { id: "event-management", label: "Event Management", icon: Calendar },
    {
      id: "demographic-analysis",
      label: "Demographic Analysis",
      icon: PieChart,
    },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        Loading...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center text-red-500">
        {error}
      </div>
    );
  }

  if (!user) {
    return null; // This will prevent the dashboard from rendering while redirecting
  }

  return (
    <div className="flex h-screen bg-gray-100">
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
            <h1 className="text-2xl font-bold text-primary">GADConnect</h1>
          )}
        </div>
        <nav className="mt-6">
          {tabs.map((tab) => (
            <Button
              key={tab.id}
              variant="ghost"
              className={cn(
                "w-full justify-start",
                !isSidebarOpen && "justify-center px-0",
                activeTab === tab.id && "bg-gray-100"
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
              <h2 className="text-xl font-semibold">
                {activeTab.replace("-", " ").charAt(0).toUpperCase() +
                  activeTab.replace("-", " ").slice(1)}
              </h2>
            </div>
            <div className="flex items-center space-x-4">
              <Notifications />
              <UserMenu user={user} />
            </div>
          </div>
        </header>

        <div className="p-6">
          {activeTab === "event-management" && <EventManagement user={user} />}
          {activeTab === "demographic-analysis" && <DemographicAnalysis />}
          {activeTab === "settings" && <SettingsSection />}
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
