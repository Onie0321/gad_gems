import React from 'react'
import { Bar, BarChart, Pie, PieChart, ResponsiveContainer } from "recharts"
import { Calendar, Users, PieChartIcon } from 'lucide-react'

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function DashboardOverview() {
    
  return (
    <>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24</div>
            <p className="text-xs text-muted-foreground">+2 from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Participants</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,234</div>
            <p className="text-xs text-muted-foreground">+15% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gender Distribution</CardTitle>
            <PieChartIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="h-[80px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: "Female", value: 60, fill: "#8884d8" },
                      { name: "Male", value: 35, fill: "#82ca9d" },
                      { name: "Other", value: 5, fill: "#ffc658" },
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={30}
                    outerRadius={40}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Events</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event Name</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Participants</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>Women in Tech Summit</TableCell>
                  <TableCell>2023-11-15</TableCell>
                  <TableCell>Virtual</TableCell>
                  <TableCell>250</TableCell>
                  <TableCell>
                    <Badge>Completed</Badge>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Gender Equality Workshop</TableCell>
                  <TableCell>2023-11-20</TableCell>
                  <TableCell>New York</TableCell>
                  <TableCell>100</TableCell>
                  <TableCell>
                    <Badge variant="outline">Upcoming</Badge>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Diversity in Leadership</TableCell>
                  <TableCell>2023-11-25</TableCell>
                  <TableCell>London</TableCell>
                  <TableCell>150</TableCell>
                  <TableCell>
                    <Badge variant="outline">Upcoming</Badge>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
      <div className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Demographic Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="age">
              <TabsList>
                <TabsTrigger value="age">Age Distribution</TabsTrigger>
                <TabsTrigger value="location">Location</TabsTrigger>
              </TabsList>
              <TabsContent value="age">
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        { age: "18-24", count: 200 },
                        { age: "25-34", count: 300 },
                        { age: "35-44", count: 250 },
                        { age: "45-54", count: 150 },
                        { age: "55+", count: 100 },
                      ]}
                    >
                      <Bar dataKey="count" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </TabsContent>
              <TabsContent value="location">
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: "North America", value: 400, fill: "#8884d8" },
                          { name: "Europe", value: 300, fill: "#82ca9d" },
                          { name: "Asia", value: 200, fill: "#ffc658" },
                          { name: "Other", value: 100, fill: "#ff8042" },
                        ]}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </>
  )
}