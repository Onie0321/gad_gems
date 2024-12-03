'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { updateUser, changePassword } from '@/lib/appwrite'

export default function SettingsModal({ isOpen, onClose, user }) {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [emailNotifications, setEmailNotifications] = useState(user.emailNotifications || false)
  const [inAppNotifications, setInAppNotifications] = useState(user.inAppNotifications || false)
  const [dataSharing, setDataSharing] = useState(user.dataSharing || false)

  const handlePasswordChange = async (e) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      alert('New passwords do not match')
      return
    }
    try {
      await changePassword(currentPassword, newPassword)
      alert('Password changed successfully')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (error) {
      console.error('Error changing password:', error)
      alert('Failed to change password')
    }
  }

  const handleSettingsChange = async () => {
    try {
      await updateUser(user.$id, {
        emailNotifications,
        inAppNotifications,
        dataSharing,
      })
      alert('Settings updated successfully')
    } catch (error) {
      console.error('Error updating settings:', error)
      alert('Failed to update settings')
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <h3 className="text-lg font-medium">Change Password</h3>
            <div>
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
            <Button type="submit">Change Password</Button>
          </form>
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Notification Preferences</h3>
            <div className="flex items-center justify-between">
              <Label htmlFor="emailNotifications">Email Notifications</Label>
              <Switch
                id="emailNotifications"
                checked={emailNotifications}
                onCheckedChange={setEmailNotifications}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="inAppNotifications">In-App Notifications</Label>
              <Switch
                id="inAppNotifications"
                checked={inAppNotifications}
                onCheckedChange={setInAppNotifications}
              />
            </div>
          </div>
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Privacy Settings</h3>
            <div className="flex items-center justify-between">
              <Label htmlFor="dataSharing">Data Sharing</Label>
              <Switch
                id="dataSharing"
                checked={dataSharing}
                onCheckedChange={setDataSharing}
              />
            </div>
          </div>
          <Button onClick={handleSettingsChange}>Save Settings</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
