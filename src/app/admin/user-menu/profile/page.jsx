'use client'

import { useState, useEffect } from "react"
import { User, Mail, Camera } from 'lucide-react'
import { getCurrentUser } from "@/lib/appwrite" // Adjust the import path as needed
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function ProfilePage() {
  const [user, setUser] = useState(null)

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await getCurrentUser()
        setUser(currentUser)
      } catch (error) {
        console.error("Error fetching user:", error)
      }
    }

    fetchUser()
  }, [])

  const handleAvatarChange = (event) => {
    // Implement avatar change logic here
    console.log("Avatar change:", event.target.files[0])
  }

  if (!user) {
    return <div>Loading...</div>
  }

  return (
    <div className="container mx-auto py-10">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Manage your profile information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center space-x-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={user.avatar } alt={user.name} />
              <AvatarFallback>{user.name ? user.name.charAt(0).toUpperCase() : 'U'}</AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-2xl font-bold">{user.name}</h2>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <div className="flex">
                <User className="w-4 h-4 mr-2 mt-3 text-muted-foreground" />
                <Input id="name" defaultValue={user.name} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="flex">
                <Mail className="w-4 h-4 mr-2 mt-3 text-muted-foreground" />
                <Input id="email" defaultValue={user.email} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="avatar">Avatar</Label>
              <div className="flex items-center space-x-4">
                <Button variant="outline" className="w-full">
                  <Camera className="w-4 h-4 mr-2" />
                  Change Avatar
                  <Input id="avatar" type="file" className="hidden" onChange={handleAvatarChange} />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button className="ml-auto">Save Changes</Button>
        </CardFooter>
      </Card>
    </div>
  )
}

