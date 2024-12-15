'use client'

import { useState } from "react"
import { Lock, Bell, Sun, Moon } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

export default function SettingsPage() {
  const [isDarkMode, setIsDarkMode] = useState(false)

  const handlePasswordChange = (event) => {
    event.preventDefault()
    // Implement password change logic here
    console.log("Password change submitted")
  }

  return (
    <div className="container mx-auto py-10">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Settings</CardTitle>
          <CardDescription>Manage your account settings and preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current-password">Current Password</Label>
              <div className="flex">
                <Lock className="w-4 h-4 mr-2 mt-3 text-muted-foreground" />
                <Input id="current-password" type="password" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <div className="flex">
                <Lock className="w-4 h-4 mr-2 mt-3 text-muted-foreground" />
                <Input id="new-password" type="password" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <div className="flex">
                <Lock className="w-4 h-4 mr-2 mt-3 text-muted-foreground" />
                <Input id="confirm-password" type="password" />
              </div>
            </div>
            <Button type="submit">Change Password</Button>
          </form>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Email Notifications</Label>
                <p className="text-sm text-muted-foreground">Receive email about your account activity.</p>
              </div>
              <Switch />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Push Notifications</Label>
                <p className="text-sm text-muted-foreground">Receive push notifications on your devices.</p>
              </div>
              <Switch />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Dark Mode</Label>
                <p className="text-sm text-muted-foreground">Enable dark mode for the application.</p>
              </div>
              <Switch
                checked={isDarkMode}
                onCheckedChange={setIsDarkMode}
                icon={isDarkMode ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
              />
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button className="ml-auto">Save Preferences</Button>
        </CardFooter>
      </Card>
    </div>
  )
}

