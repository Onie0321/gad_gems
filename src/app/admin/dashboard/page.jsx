import React, { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { Calendar, Users, PieChartIcon, Users2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  userCollectionId,
  databaseId,
  databases,
  fetchTotals,
} from "@/lib/appwrite";

export default function DashboardOverview() {
  const [events, setEvents] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [pendingUsers, setPendingUsers] = useState(0);
  const [approvedUsers, setApprovedUsers] = useState(0);
  const [totalEvents, setTotalEvents] = useState(0);
  const [totalParticipants, setTotalParticipants] = useState(0);
  const [sexDistribution, setSexDistribution] = useState([]);
  const [ageDistribution, setAgeDistribution] = useState([]);
  const [locationDistribution, setLocationDistribution] = useState([]);
  const [academicEvents, setAcademicEvents] = useState(0);
  const [nonAcademicEvents, setNonAcademicEvents] = useState(0);

  useEffect(() => {
    fetchData();
  }, []);

  // Update your fetchData function
  const fetchData = async () => {
    try {
      const {
        events,
        totalEvents,
        academicEvents,
        nonAcademicEvents,
        totalParticipants,
        sexDistribution,
        ageDistribution,
        locationDistribution,
      } = await fetchTotals();

      setEvents(events);
      setTotalEvents(totalEvents);
      setAcademicEvents(academicEvents);
      setNonAcademicEvents(nonAcademicEvents);
      setTotalParticipants(totalParticipants);
      setSexDistribution(sexDistribution);
      setAgeDistribution(ageDistribution);
      setLocationDistribution(locationDistribution);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  useEffect(() => {
    const fetchTotalUsers = async () => {
      try {
        const response = await databases.listDocuments(
          databaseId,
          userCollectionId
        );

        // Count total users
        setTotalUsers(response.total);

        // Count users by approval status
        const pendingCount = response.documents.filter(
          (user) => user.approvalStatus === "pending"
        ).length;

        const approvedCount = response.documents.filter(
          (user) => user.approvalStatus === "approved"
        ).length;

        setPendingUsers(pendingCount);
        setApprovedUsers(approvedCount);
      } catch (error) {
        console.error("Error fetching total users:", error);
      }
    };

    fetchTotalUsers();
  }, []);

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEvents}</div>
            <div className="flex flex-col space-y-1 text-xs text-muted-foreground">
              <div className="flex items-center justify-between">
                <span>Academic:</span>
                <Badge variant="default">{academicEvents}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Non-Academic:</span>
                <Badge variant="outline">{nonAcademicEvents}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Participants
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalParticipants}</div>
            <p className="text-xs text-muted-foreground">
              {totalParticipants > 0
                ? `${totalParticipants} participants recorded`
                : "No participants yet"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers}</div>
            <div className="flex flex-col space-y-1 text-xs text-muted-foreground">
              <div className="flex items-center justify-between">
                <span>Approved:</span>
                <Badge variant="success">{approvedUsers}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Pending:</span>
                <Badge variant="warning">{pendingUsers}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Sex Distribution
            </CardTitle>
            <PieChartIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="h-[80px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sexDistribution}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={30}
                    outerRadius={40}
                  >
                    {sexDistribution.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          index === 0
                            ? "#8884d8"
                            : index === 1
                            ? "#82ca9d"
                            : "#ffc658"
                        }
                      />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 flex justify-center space-x-2">
              {sexDistribution.map((entry, index) => (
                <div key={`legend-${index}`} className="flex items-center">
                  <div
                    className="w-3 h-3 mr-1"
                    style={{
                      backgroundColor:
                        index === 0
                          ? "#8884d8"
                          : index === 1
                          ? "#82ca9d"
                          : "#ffc658",
                    }}
                  ></div>
                  <span className="text-xs">
                    {entry.name}: {entry.value}
                  </span>
                </div>
              ))}
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
                  <TableHead className="text-center">Participants</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.slice(0, 3).map((event) => (
                  <TableRow key={event.$id}>
                    <TableCell>{event.eventName}</TableCell>
                    <TableCell>
                      {new Date(event.eventDate).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </TableCell>
                    <TableCell>{event.eventVenue}</TableCell>
                    <TableCell className="text-center">
                      {event.participantCount}{" "}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          event.approvalStatus === "approved"
                            ? "success"
                            : event.approvalStatus === "pending"
                            ? "warning"
                            : "destructive"
                        }
                      >
                        {event.approvalStatus}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
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
                    <BarChart data={ageDistribution}>
                      <XAxis dataKey="age" />
                      <YAxis />
                      <Tooltip />
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
                        data={locationDistribution}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        {locationDistribution.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={`hsl(${index * 45}, 70%, 60%)`}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
