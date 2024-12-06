'use client'

import { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import QuestionManagement from '@/components/QuestionManagement'
import UserResponses from './user-response/page'
import ChartsAndTables from '@/components/questions/chartsandtables'
import Auth from '@/components/Auth'
import { getCurrentUser } from '@/lib/appwrite'
import { useToast } from 'react-toastify'

export default function Questionnaires() {
  const [user, setUser] = useState(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchUser()
  }, [])

  const fetchUser = async () => {
    try {
      const currentUser = await getCurrentUser()
      setUser(currentUser)
    } catch (error) {
      console.error('Error fetching user:', error)
      toast({
        title: "Error",
        description: "Failed to fetch user data. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleAuthStateChange = (newUser) => {
    setUser(newUser)
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Quiz Application</h1>
      {user ? (
        <Tabs defaultValue="questions">
          <TabsList>
            {user.role === 'admin' && <TabsTrigger value="questions">Question Management</TabsTrigger>}
            <TabsTrigger value="responses">User Responses</TabsTrigger>
            <TabsTrigger value="charts">Charts and Tables</TabsTrigger>
          </TabsList>
          {user.role === 'admin' && (
            <TabsContent value="questions">
              <Card>
                <CardContent>
                  <QuestionManagement />
                </CardContent>
              </Card>
            </TabsContent>
          )}
          <TabsContent value="responses">
            <Card>
              <CardContent>
                <UserResponses user={user} />
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="charts">
            <Card>
              <CardContent>
                <ChartsAndTables />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      ) : (
        <Card>
          <CardContent>
            <Auth onAuthStateChange={handleAuthStateChange} />
          </CardContent>
        </Card>
      )}
    </div>
  )
}

