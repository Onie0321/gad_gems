"use client"

import * as React from "react"
import { Bell, Calendar, ChevronDown, FileText, Home, LayoutDashboard, LogOut, MessageSquare, Settings, Users } from 'lucide-react'

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import DashboardOverview from "./dashboard/page"
import EventsSection from "./events/page"
import DemographicsSection from "./demographics/page"
import ReportsSection from "./reports/page"
import FeedbackSection from "./feedback/page"
import SettingsSection from "./settings/page"

export default function AdminDashboard() {
  const [activeSection, setActiveSection] = React.useState("dashboard")

  const renderActiveSection = () => {
    switch (activeSection) {
      case "events":
        return <EventsSection />
      case "demographics":
        return <DemographicsSection />
      case "reports":
        return <ReportsSection />
      case "feedback":
        return <FeedbackSection />
      case "settings":
        return <SettingsSection />
      default:
        return <DashboardOverview />
    }
  }

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      {/* Sidebar */}
      <aside className="hidden w-64 overflow-y-auto bg-white dark:bg-gray-800 md:block">
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-center p-5">
            <h1 className="text-2xl font-bold text-blue-600 dark:text-blue-400">GADConnect</h1>
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
              variant={activeSection === "events" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveSection("events")}
            >
              <Calendar className="mr-2 h-4 w-4" />
              Events
            </Button>
            <Button
              variant={activeSection === "demographics" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveSection("demographics")}
            >
              <Users className="mr-2 h-4 w-4" />
              Demographics
            </Button>
            <Button
              variant={activeSection === "reports" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveSection("reports")}
            >
              <FileText className="mr-2 h-4 w-4" />
              Reports
            </Button>
            <Button
              variant={activeSection === "feedback" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveSection("feedback")}
            >
              <MessageSquare className="mr-2 h-4 w-4" />
              Feedback
            </Button>
            <Button
              variant={activeSection === "settings" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveSection("settings")}
            >
              <Settings className="mr-2 h-4 w-4" />
              Settings
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
            <Button variant="outline" size="icon">
              <Bell className="h-4 w-4" />
              <span className="sr-only">Notifications</span>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="/placeholder-avatar.jpg" alt="@johndoe" />
                    <AvatarFallback>JD</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">John Doe</p>
                    <p className="text-xs leading-none text-muted-foreground">john@example.com</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Users className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        {/* Dashboard Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {renderActiveSection()}
        </main>
      </div>
    </div>
  )
}