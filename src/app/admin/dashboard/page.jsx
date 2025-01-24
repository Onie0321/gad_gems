"use client";

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
import { Query } from "appwrite";

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
  eventCollectionId,
  participantCollectionId,
  getCurrentAcademicPeriod,
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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Get current academic period
      const currentPeriod = await getCurrentAcademicPeriod();
      if (!currentPeriod) {
        throw new Error("No active academic period found");
      }

      // Fetch events first
      const eventsResponse = await databases.listDocuments(
        databaseId,
        eventCollectionId,
        [
          Query.equal("isArchived", false),
          Query.equal("academicPeriodId", currentPeriod.$id),
          Query.orderDesc("$createdAt"),
          Query.limit(10),
        ]
      );

      // Get all event IDs from the current period
      const eventIds = eventsResponse.documents.map((event) => event.$id);

      // Fetch participants for these specific events
      const participantsResponse = await databases.listDocuments(
        databaseId,
        participantCollectionId,
        [
          Query.equal("isArchived", false),
          Query.equal("eventId", eventIds), // This will get participants for all current period events
        ]
      );

      // Get creator information for each event
      const eventsWithDetails = await Promise.all(
        eventsResponse.documents.map(async (event) => {
          try {
            // Get creator info
            const creator = await databases.getDocument(
              databaseId,
              userCollectionId,
              event.createdBy
            );

            // Filter participants for this specific event
            const eventParticipants = participantsResponse.documents.filter(
              (p) => p.eventId === event.$id
            );

            return {
              ...event,
              createdByName: creator.name || "Unknown",
              participants: eventParticipants,
            };
          } catch (error) {
            console.error(
              `Error fetching details for event ${event.$id}:`,
              error
            );
            return {
              ...event,
              createdByName: "Unknown",
              participants: [],
            };
          }
        })
      );

      // Calculate statistics
      const {
        totalEvents,
        academicEvents,
        nonAcademicEvents,
        totalParticipants,
        sexDistribution,
        ageDistribution,
        locationDistribution,
      } = await fetchTotals(currentPeriod.$id);

      // Fetch user statistics
      const usersResponse = await databases.listDocuments(
        databaseId,
        userCollectionId
      );

      const pendingCount = usersResponse.documents.filter(
        (user) => user.approvalStatus === "pending"
      ).length;

      const approvedCount = usersResponse.documents.filter(
        (user) => user.approvalStatus === "approved"
      ).length;

      // Update all states
      setEvents(eventsWithDetails);
      setParticipants(participantsResponse.documents);
      setTotalUsers(usersResponse.total);
      setPendingUsers(pendingCount);
      setApprovedUsers(approvedCount);
      setTotalEvents(totalEvents);
      setAcademicEvents(academicEvents);
      setNonAcademicEvents(nonAcademicEvents);
      setTotalParticipants(totalParticipants);
      setSexDistribution(sexDistribution);
      setAgeDistribution(ageDistribution);
      setLocationDistribution(locationDistribution);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center text-red-600">
          <p>Error loading dashboard: {error}</p>
          <button
            onClick={fetchDashboardData}
            className="mt-4 px-4 py-2 bg-primary text-white rounded hover:bg-primary/90"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

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
                          entry.name === "Male"
                            ? "#2196F3"
                            : entry.name === "Female"
                            ? "#E91E63"
                            : "#FFC107"
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
                        entry.name === "Male"
                          ? "#2196F3"
                          : entry.name === "Female"
                          ? "#E91E63"
                          : "#FFC107",
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
                  <TableHead>Type</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead className="text-center">Participants</TableHead>
                  <TableHead>Created By</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.map((event) => {
                  const maleCount = event.participants.filter(
                    (p) => p.sex === "Male"
                  ).length;
                  const femaleCount = event.participants.filter(
                    (p) => p.sex === "Female"
                  ).length;

                  return (
                    <TableRow key={event.$id}>
                      <TableCell className="font-medium">
                        {event.eventName}
                      </TableCell>
                      <TableCell>
                        {new Date(event.eventDate).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            event.eventType === "Academic"
                              ? "default"
                              : "secondary"
                          }
                        >
                          {event.eventType}
                        </Badge>
                      </TableCell>
                      <TableCell>{event.eventVenue}</TableCell>
                      <TableCell className="text-center">
                        <div className="flex flex-col items-center">
                          <div>Total: {maleCount + femaleCount}</div>
                          <div className="text-sm text-muted-foreground">
                            <span className="text-blue-600">{maleCount}</span>
                            {" / "}
                            <span className="text-pink-600">{femaleCount}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{event.createdByName}</TableCell>
                    </TableRow>
                  );
                })}
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
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="age">Age Distribution</TabsTrigger>
                <TabsTrigger value="location">
                  Location Distribution
                </TabsTrigger>
              </TabsList>
              <TabsContent value="age" className="space-y-4">
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={ageDistribution}>
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar
                        dataKey="value"
                        fill="#8884d8"
                        label={{ position: "top" }}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </TabsContent>
              <TabsContent value="location" className="space-y-4">
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={locationDistribution}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        label={({ name, value, percent }) => 
                          `${name}: ${value} (${(percent * 100).toFixed(1)}%)`
                        }
                        labelLine={true}
                      >
                        {locationDistribution.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={`hsl(${index * (360 / locationDistribution.length)}, 70%, 60%)`}
                          />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value, name, props) => [
                          `${value} participants (${((value / participants.length) * 100).toFixed(1)}%)`,
                          `Location: ${props.payload.name}`
                        ]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Location</TableHead>
                        <TableHead>Count</TableHead>
                        <TableHead>Percentage</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {locationDistribution.map((item, index) => {
                        const percentage = ((item.value / participants.length) * 100).toFixed(1);
                        return (
                          <TableRow key={item.name}>
                            <TableCell className="flex items-center gap-2">
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{
                                  backgroundColor: `hsl(${index * (360 / locationDistribution.length)}, 70%, 60%)`
                                }}
                              />
                              {item.name}
                            </TableCell>
                            <TableCell>{item.value}</TableCell>
                            <TableCell>{percentage}%</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
