'use client'

import { useState } from 'react'
import { Bell, Calendar, ChevronDown, FileText, Home, PieChart, Settings, Users } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

import EventManagement from './event-management/page'
import DemographicAnalysis from './demographic-analysis/page'
import ReportsAnalytics from './reports-analytics/page'

export default function OfficerDashboard() {
  const [activeTab, setActiveTab] = useState('event-management')

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-md">
        <div className="p-4">
          <h1 className="text-2xl font-bold text-primary">GADConnect</h1>
        </div>
        <nav className="mt-6">
          <Button variant="ghost" className="w-full justify-start" onClick={() => setActiveTab('event-management')}>
            <Calendar className="mr-2 h-4 w-4" />
            Event Management
          </Button>
          <Button variant="ghost" className="w-full justify-start" onClick={() => setActiveTab('demographic-analysis')}>
            <PieChart className="mr-2 h-4 w-4" />
            Demographic Analysis
          </Button>
          <Button variant="ghost" className="w-full justify-start" onClick={() => setActiveTab('reports-analytics')}>
            <FileText className="mr-2 h-4 w-4" />
            Reports & Analytics
          </Button>
          <Button variant="ghost" className="w-full justify-start" onClick={() => setActiveTab('admin-controls')}>
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Button>
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <header className="bg-white shadow-sm">
          <div className="flex items-center justify-between px-4 py-3">
            <h2 className="text-xl font-semibold">{activeTab.replace('-', ' ').charAt(0).toUpperCase() + activeTab.replace('-', ' ').slice(1)}</h2>
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="icon">
                <Bell className="h-4 w-4" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src="/avatars/01.png" alt="@shadcn" />
                      <AvatarFallback>SC</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">shadcn</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        m@example.com
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem>Log out</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        <div className="p-6">
          {activeTab === 'event-management' && <EventManagement />}
          {activeTab === 'demographic-analysis' && <DemographicAnalysis />}
          {activeTab === 'reports-analytics' && <ReportsAnalytics />}
        </div>
      </main>
    </div>
  )
}