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

export default function DashboardOverview({
  users,
  participants,
  events,
  participantTotals,
}) {
  const [totalUsers, setTotalUsers] = useState(0);
  const [pendingUsers, setPendingUsers] = useState(0);
  const [approvedUsers, setApprovedUsers] = useState(0);
  const [totalEvents, setTotalEvents] = useState(0);
  const [sexDistribution, setSexDistribution] = useState([]);
  const [ageDistribution, setAgeDistribution] = useState([]);
  const [locationDistribution, setLocationDistribution] = useState([]);
  const [academicEvents, setAcademicEvents] = useState(0);
  const [nonAcademicEvents, setNonAcademicEvents] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [participantTypeCounts, setParticipantTypeCounts] = useState({
    students: 0,
    staffFaculty: 0,
    communityMembers: 0,
  });
  const [eventsWithCreators, setEventsWithCreators] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    const counts = {
      students: participants.filter((p) => p.participantType === "Student")
        .length,
      staffFaculty: participants.filter(
        (p) => p.participantType === "Staff/Faculty"
      ).length,
      communityMembers: participants.filter(
        (p) => p.participantType === "Community Member"
      ).length,
    };
    setParticipantTypeCounts(counts);
  }, [participants]);

  useEffect(() => {
    const fetchEventCreators = async () => {
      try {
        const eventsWithDetails = await Promise.all(
          events.map(async (event) => {
            try {
              // Get creator info from users array first
              let creator = users.find((user) => user.$id === event.createdBy);

              // If not found in users array, fetch from database
              if (!creator && event.createdBy) {
                const response = await databases.getDocument(
                  databaseId,
                  userCollectionId,
                  event.createdBy
                );
                creator = response;
              }

              return {
                ...event,
                createdByName: creator?.name || "Unknown User",
              };
            } catch (error) {
              console.error(
                `Error fetching creator for event ${event.$id}:`,
                error
              );
              return {
                ...event,
                createdByName: "Unknown User",
              };
            }
          })
        );

        setEventsWithCreators(eventsWithDetails);
      } catch (error) {
        console.error("Error fetching event creators:", error);
      }
    };

    if (events.length > 0) {
      fetchEventCreators();
    }
  }, [events, users]);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Get current academic period
      const currentPeriod = await getCurrentAcademicPeriod();
      if (!currentPeriod) {
        throw new Error("No active academic period found");
      }

      // Calculate statistics
      const {
        totalEvents,
        academicEvents,
        nonAcademicEvents,
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

      // Update states
      setTotalUsers(usersResponse.total);
      setPendingUsers(pendingCount);
      setApprovedUsers(approvedCount);
      setTotalEvents(totalEvents);
      setAcademicEvents(academicEvents);
      setNonAcademicEvents(nonAcademicEvents);
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

 

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-blue-300 to-blue-400">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-black">
              Total Events
            </CardTitle>
            <Calendar className="h-4 w-4 text-black" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-black">{totalEvents}</div>
            <div className="flex flex-col space-y-1 text-xs text-black">
              <div className="flex items-center justify-between">
                <span>Academic:</span>
                <Badge
                  variant="default"
                  className="bg-black/10 text-black hover:bg-black/20"
                >
                  {academicEvents}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Non-Academic:</span>
                <Badge variant="outline" className="border-black/20 text-black">
                  {nonAcademicEvents}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-300 to-purple-400">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-black">
              Total Participants
            </CardTitle>
            <Users className="h-4 w-4 text-black" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-black">
              {participants.length}
            </div>
            <div className="text-xs text-black mt-2">
              <div className="flex justify-between">
                <span>Students:</span>
                <span className="font-medium">
                  {participantTypeCounts.students}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Staff/Faculty:</span>
                <span className="font-medium">
                  {participantTypeCounts.staffFaculty}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Community Members:</span>
                <span className="font-medium">
                  {participantTypeCounts.communityMembers}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-300 to-green-400">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-black">
              Total Users
            </CardTitle>
            <Users2 className="h-4 w-4 text-black" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-black">{totalUsers}</div>
            <div className="flex flex-col space-y-1 text-xs text-black">
              <div className="flex items-center justify-between">
                <span>Approved:</span>
                <Badge
                  variant="success"
                  className="bg-black/10 text-black hover:bg-black/20"
                >
                  {approvedUsers}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Pending:</span>
                <Badge
                  variant="warning"
                  className="bg-black/10 text-black hover:bg-black/20"
                >
                  {pendingUsers}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-pink-300 to-pink-400">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-black">
              Sex Distribution
            </CardTitle>
            <PieChartIcon className="h-4 w-4 text-black" />
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
                            : "#9E9E9E"
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
                          : "#9E9E9E",
                    }}
                  ></div>
                  <span className="text-xs text-black">
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
                  <TableHead className="font-bold text-black">
                    Event Name
                  </TableHead>

                  <TableHead className="font-bold text-black">Date</TableHead>
                  <TableHead className="font-bold text-black">Type</TableHead>
                  <TableHead className="font-bold text-black">
                    Location
                  </TableHead>
                  <TableHead className="text-center font-bold text-black">
                    Participants
                  </TableHead>
                  <TableHead className="font-bold text-black">
                    Created By
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {eventsWithCreators.map((event) => {
                  const eventParticipants = participants.filter(
                    (p) => p.eventId === event.$id
                  );
                  const maleCount = eventParticipants.filter(
                    (p) => p.sex === "Male"
                  ).length;
                  const femaleCount = eventParticipants.filter(
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
                        label={{
                          position: "center",
                          content: ({ x, y, width, height, value }) => (
                            <text
                              x={x + width / 2}
                              y={y + height / 2}
                              fill="#000"
                              fontSize={50}
                              fontWeight="bold"
                              textAnchor="middle"
                              dominantBaseline="middle"
                            >
                              {value}
                            </text>
                          ),
                        }}
                      >
                        {ageDistribution.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={`hsl(${
                              index * (360 / ageDistribution.length)
                            }, 70%, 60%)`}
                          />
                        ))}
                      </Bar>
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
                            fill={`hsl(${
                              index * (360 / locationDistribution.length)
                            }, 70%, 60%)`}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value, name, props) => [
                          `${value} participants (${(
                            (value / participants.length) *
                            100
                          ).toFixed(1)}%)`,
                          `Location: ${props.payload.name}`,
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
                        const percentage = (
                          (item.value / participants.length) *
                          100
                        ).toFixed(1);
                        return (
                          <TableRow key={item.name}>
                            <TableCell className="flex items-center gap-2">
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{
                                  backgroundColor: `hsl(${
                                    index * (360 / locationDistribution.length)
                                  }, 70%, 60%)`,
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
