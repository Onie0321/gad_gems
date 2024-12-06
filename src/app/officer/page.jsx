'use client'

import { useState } from 'react'
import { Calendar, FileText, PieChart, Settings, Menu, X, SquareUser } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import EventManagement from './event-management/page'
import DemographicAnalysis from './demographic-analysis/page'
import PersonnelStatistic from './personnel/page'
import { Notifications } from './notifications/page'
import { UserMenu } from './user-menu/page'
import SettingsForm from './settings/page'
import StudentDashboard from './student/page'
import Questionnaires from './Questionnaires/page'

export default function OfficerDashboard() {
  const [activeTab, setActiveTab] = useState('event-management')
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen)

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className={cn(
        "bg-white shadow-md transition-all duration-300 ease-in-out",
        isSidebarOpen ? "w-64" : "w-16"
      )}>
        <div className="p-4 flex items-center">
          <img src="/logo.svg" alt="GADConnect Logo" className="h-8 w-8 mr-2" />
          {isSidebarOpen && <h1 className="text-2xl font-bold text-primary">GADConnect</h1>}
        </div>
        <nav className="mt-6">
          <Button variant="ghost" className={cn(
            "w-full justify-start",
            !isSidebarOpen && "justify-center px-0"
          )} onClick={() => setActiveTab('event-management')}>
            <Calendar className="h-4 w-4" />
            {isSidebarOpen && <span className="ml-2">Event Management</span>}
          </Button>
          <Button variant="ghost" className={cn(
            "w-full justify-start",
            !isSidebarOpen && "justify-center px-0"
          )} onClick={() => setActiveTab('demographic-analysis')}>
            <PieChart className="h-4 w-4" />
            {isSidebarOpen && <span className="ml-2">Demographic Analysis</span>}
          </Button>
          <Button variant="ghost" className={cn(
            "w-full justify-start",
            !isSidebarOpen && "justify-center px-0"
          )} onClick={() => setActiveTab('Questionnaires')}>
            <PieChart className="h-4 w-4" />
            {isSidebarOpen && <span className="ml-2">Questionnaires</span>}
          </Button>
          <Button variant="ghost" className={cn(
            "w-full justify-start",
            !isSidebarOpen && "justify-center px-0"
          )} onClick={() => setActiveTab('personnel')}>
            <FileText className="h-4 w-4" />
            {isSidebarOpen && <span className="ml-2">Personnel Statistic</span>}
          </Button>
          <Button variant="ghost" className={cn(
            "w-full justify-start",
            !isSidebarOpen && "justify-center px-0"
          )} onClick={() => setActiveTab('student')}>
            <SquareUser className="h-4 w-4" />
            {isSidebarOpen && <span className="ml-2">Student</span>}
          </Button>
          <Button variant="ghost" className={cn(
            "w-full justify-start",
            !isSidebarOpen && "justify-center px-0"
          )} onClick={() => setActiveTab('settings')}>
            <Settings className="h-4 w-4" />
            {isSidebarOpen && <span className="ml-2">Settings</span>}
          </Button>
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <header className="bg-white shadow-sm">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center">
              <Button variant="ghost" size="icon" onClick={toggleSidebar} className="mr-2">
                {isSidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
              </Button>
              <h2 className="text-xl font-semibold">{activeTab.replace('-', ' ').charAt(0).toUpperCase() + activeTab.replace('-', ' ').slice(1)}</h2>
            </div>
            <div className="flex items-center space-x-4">
              <Notifications />
              <UserMenu />
            </div>
          </div>
        </header>

        <div className="p-6">
          {activeTab === 'event-management' && <EventManagement />}
          {activeTab === 'demographic-analysis' && <DemographicAnalysis />}
          {activeTab === 'Questionnaires' && <Questionnaires />}
          {activeTab === 'personnel' && <PersonnelStatistic />}
          {activeTab === 'student' && <StudentDashboard />}
          {activeTab === 'settings' && <SettingsForm />}
        </div>
      </main>
    </div>
  )
}

