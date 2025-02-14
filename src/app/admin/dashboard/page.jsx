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
import { formatDistanceToNow } from "date-fns";

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
  const [activeUsers, setActiveUsers] = useState(0);
  const [inactiveUsers, setInactiveUsers] = useState(0);
  const [verifiedUsers, setVerifiedUsers] = useState(0);
  const [unverifiedUsers, setUnverifiedUsers] = useState(0);
  const [chartData, setChartData] = useState([]);

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
          events
            .sort((a, b) => new Date(b.$createdAt) - new Date(a.$createdAt))
            .slice(0, 5)
            .map(async (event) => {
              try {
                let creator = users.find(
                  (user) => user.$id === event.createdBy
                );

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

  useEffect(() => {
    const fetchUserCounts = async () => {
      try {
        const usersResponse = await databases.listDocuments(
          databaseId,
          userCollectionId
        );
        const allUsers = usersResponse.documents;

        // Count active/inactive users (based on last login within 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const active = allUsers.filter(
          (user) => new Date(user.lastLogin || user.$createdAt) > thirtyDaysAgo
        ).length;

        setActiveUsers(active);
        setInactiveUsers(allUsers.length - active);

        // Count verified/unverified users
        const verified = allUsers.filter(
          (user) => user.emailVerification
        ).length;
        setVerifiedUsers(verified);
        setUnverifiedUsers(allUsers.length - verified);
      } catch (error) {
        console.error("Error fetching user counts:", error);
      }
    };

    fetchUserCounts();
  }, []);

  useEffect(() => {
    // Calculate total male/female counts across all participants
    const maleCount = participants.filter((p) => p.sex === "Male").length;
    const femaleCount = participants.filter((p) => p.sex === "Female").length;

    const newSexDistribution = [
      {
        name: "Male",
        value: maleCount,
        details: {
          students: participants.filter(
            (p) => p.participantType === "Student" && p.sex === "Male"
          ).length,
          staffFaculty: participants.filter(
            (p) => p.participantType === "Staff/Faculty" && p.sex === "Male"
          ).length,
          community: participants.filter(
            (p) => p.participantType === "Community Member" && p.sex === "Male"
          ).length,
        },
      },
      {
        name: "Female",
        value: femaleCount,
        details: {
          students: participants.filter(
            (p) => p.participantType === "Student" && p.sex === "Female"
          ).length,
          staffFaculty: participants.filter(
            (p) => p.participantType === "Staff/Faculty" && p.sex === "Female"
          ).length,
          community: participants.filter(
            (p) =>
              p.participantType === "Community Member" && p.sex === "Female"
          ).length,
        },
      },
    ];

    setSexDistribution(newSexDistribution);
  }, [participants]);

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

      // Ensure data is properly formatted and contains no NaN values
      const validData = [
        {
          name: "Male",
          value: Number.isNaN(sexDistribution[0].value)
            ? 0
            : sexDistribution[0].value,
          details: sexDistribution[0].details,
        },
        {
          name: "Female",
          value: Number.isNaN(sexDistribution[1].value)
            ? 0
            : sexDistribution[1].value,
          details: sexDistribution[1].details,
        },
      ];
      setSexDistribution(validData);
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
                  variant="outline"
                  className="border-black/20 text-black hover:bg-black/20 transition-colors"
                >
                  {academicEvents}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Non-Academic:</span>
                <Badge
                  variant="outline"
                  className="border-black/20 text-black hover:bg-black/20 transition-colors"
                >
                  {nonAcademicEvents}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Created:</span>
                <Badge
                  variant="outline"
                  className="border-black/20 text-black hover:bg-black/20 transition-colors"
                >
                  {
                    events.filter((e) => !e.source || e.source === "created")
                      .length
                  }
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Imported:</span>
                <Badge
                  variant="outline"
                  className="border-black/20 text-black hover:bg-black/20 transition-colors"
                >
                  {
                    events.filter((e) => e.source && e.source !== "imported")
                      .length
                  }
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
            <div className="text-xs text-black mt-2 space-y-2">
              <div className="flex flex-col space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Students:</span>
                  <div className="flex gap-1">
                    <Badge
                      variant="outline"
                      className="border-black/20 text-black hover:bg-black/20 transition-colors"
                    >
                      {participantTypeCounts.students}
                    </Badge>
                    <Badge
                      variant="outline"
                      className="bg-blue-100/50 border-blue-200 text-black hover:bg-blue-200/50"
                    >
                      {
                        participants.filter(
                          (p) =>
                            p.participantType === "Student" && p.sex === "Male"
                        ).length
                      }
                    </Badge>
                    <Badge
                      variant="outline"
                      className="bg-pink-100/50 border-pink-200 text-black hover:bg-pink-200/50"
                    >
                      {
                        participants.filter(
                          (p) =>
                            p.participantType === "Student" &&
                            p.sex === "Female"
                        ).length
                      }
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="flex flex-col space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Staff/Faculty:</span>
                  <div className="flex gap-1">
                    <Badge
                      variant="outline"
                      className="border-black/20 text-black hover:bg-black/20 transition-colors"
                    >
                      {participantTypeCounts.staffFaculty}
                    </Badge>
                    <Badge
                      variant="outline"
                      className="bg-blue-100/50 border-blue-200 text-black hover:bg-blue-200/50"
                    >
                      {
                        participants.filter(
                          (p) =>
                            p.participantType === "Staff/Faculty" &&
                            p.sex === "Male"
                        ).length
                      }
                    </Badge>
                    <Badge
                      variant="outline"
                      className="bg-pink-100/50 border-pink-200 text-black hover:bg-pink-200/50"
                    >
                      {
                        participants.filter(
                          (p) =>
                            p.participantType === "Staff/Faculty" &&
                            p.sex === "Female"
                        ).length
                      }
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="flex flex-col space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Community:</span>
                  <div className="flex gap-1">
                    <Badge
                      variant="outline"
                      className="border-black/20 text-black hover:bg-black/20 transition-colors"
                    >
                      {participantTypeCounts.communityMembers}
                    </Badge>
                    <Badge
                      variant="outline"
                      className="bg-blue-100/50 border-blue-200 text-black hover:bg-blue-200/50"
                    >
                      {
                        participants.filter(
                          (p) =>
                            p.participantType === "Community Member" &&
                            p.sex === "Male"
                        ).length
                      }
                    </Badge>
                    <Badge
                      variant="outline"
                      className="bg-pink-100/50 border-pink-200 text-black hover:bg-pink-200/50"
                    >
                      {
                        participants.filter(
                          (p) =>
                            p.participantType === "Community Member" &&
                            p.sex === "Female"
                        ).length
                      }
                    </Badge>
                  </div>
                </div>
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
                  variant="outline"
                  className="border-black/20 text-black hover:bg-black/20 transition-colors"
                >
                  {approvedUsers}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Pending:</span>
                <Badge
                  variant="outline"
                  className="border-black/20 text-black hover:bg-black/20 transition-colors"
                >
                  {pendingUsers}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Active:</span>
                <Badge
                  variant="outline"
                  className="border-black/20 text-black hover:bg-black/20 transition-colors"
                >
                  {activeUsers}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Inactive:</span>
                <Badge
                  variant="outline"
                  className="border-black/20 text-black hover:bg-black/20 transition-colors"
                >
                  {inactiveUsers}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Verified:</span>
                <Badge
                  variant="outline"
                  className="border-black/20 text-black hover:bg-black/20 transition-colors"
                >
                  {verifiedUsers}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Unverified:</span>
                <Badge
                  variant="outline"
                  className="border-black/20 text-black hover:bg-black/20 transition-colors"
                >
                  {unverifiedUsers}
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
            <div className="h-[120px]">
              {sexDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={sexDistribution}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={55}
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
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length > 0) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-white p-2 rounded shadow text-xs">
                              <p className="font-bold">{data.name}</p>
                              <p>Total: {data.value}</p>
                              <p>Students: {data.details.students}</p>
                              <p>Staff/Faculty: {data.details.staffFaculty}</p>
                              <p>Community: {data.details.community}</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[200px]">
                  <p>No data available</p>
                </div>
              )}
            </div>
            <div className="mt-2 flex flex-col items-center space-y-2">
              {sexDistribution.map((entry, index) => (
                <div
                  key={`legend-${index}`}
                  className="flex items-center space-x-2"
                >
                  <div className="flex items-center w-20">
                    <div
                      className="w-3 h-3 mr-1 rounded-full"
                      style={{
                        backgroundColor:
                          entry.name === "Male"
                            ? "#2196F3"
                            : entry.name === "Female"
                            ? "#E91E63"
                            : "#9E9E9E",
                      }}
                    ></div>
                    <span className="text-xs text-black">{entry.name}:</span>
                  </div>
                  <Badge
                    variant="outline"
                    className={`border-black/20 text-black hover:bg-black/20 transition-colors ${
                      entry.name === "Male"
                        ? "bg-blue-100/50 border-blue-200"
                        : "bg-pink-100/50 border-pink-200"
                    }`}
                  >
                    {entry.value}
                  </Badge>
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
                  <TableHead className="font-bold text-black">
                    Location
                  </TableHead>
                  <TableHead className="text-center font-bold text-black">
                    Participants
                  </TableHead>
                  <TableHead className="font-bold text-black">Source</TableHead>
                  <TableHead className="font-bold text-black">
                    Created At
                  </TableHead>
                  <TableHead className="font-bold text-black">
                    Created By
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {eventsWithCreators
                  .sort(
                    (a, b) => new Date(b.$createdAt) - new Date(a.$createdAt)
                  )
                  .slice(0, 5)
                  .map((event) => {
                    const eventParticipants = participants.filter(
                      (p) => p.eventId === event.$id
                    );
                    const counts = {
                      students: eventParticipants.filter(
                        (p) => p.participantType === "Student"
                      ).length,
                      staffFaculty: eventParticipants.filter(
                        (p) => p.participantType === "Staff/Faculty"
                      ).length,
                      community: eventParticipants.filter(
                        (p) => p.participantType === "Community Member"
                      ).length,
                    };

                    return (
                      <TableRow key={event.$id}>
                        <TableCell className="font-medium">
                          {event.eventName}
                        </TableCell>
                        <TableCell>
                          {new Date(event.eventDate).toLocaleDateString(
                            "en-US",
                            {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            }
                          )}
                        </TableCell>
                        <TableCell>{event.eventVenue}</TableCell>
                        <TableCell className="text-center">
                          <div className="flex flex-col items-center">
                            <div>Total: {eventParticipants.length}</div>
                            <div className="text-xs text-muted-foreground space-x-2">
                              <span>S: {counts.students}</span>
                              <span>F: {counts.staffFaculty}</span>
                              <span>C: {counts.community}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`border-black/20 text-black hover:bg-black/20 transition-colors ${
                              !event.source || event.source === "Created"
                                ? "bg-green-100/50 border-green-200"
                                : "bg-blue-100/50 border-blue-200"
                            }`}
                          >
                            {event.source || "Created"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span>
                              {new Date(event.$createdAt).toLocaleString(
                                "en-US",
                                {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                  hour: "numeric",
                                  minute: "2-digit",
                                  hour12: true,
                                }
                              )}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(event.$createdAt), {
                                addSuffix: true,
                              })}
                            </span>
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
                  {ageDistribution.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={ageDistribution}>
                        <XAxis
                          dataKey="name"
                          angle={-45}
                          textAnchor="end"
                          height={70}
                        />
                        <YAxis tickFormatter={(value) => Math.round(value)} />
                        <Tooltip
                          content={({ active, payload, label }) => {
                            if (active && payload && payload.length > 0) {
                              const data = payload[0].payload;
                              return (
                                <div className="bg-white p-2 rounded shadow text-xs">
                                  <p className="font-bold">{data.name}</p>
                                  <p>Total: {data.value}</p>
                                  <p>Male: {data.male}</p>
                                  <p>Female: {data.female}</p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Bar
                          dataKey="value"
                          fill="#8884d8"
                          label={{
                            position: "top",
                            formatter: (value) => Math.round(value),
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
                  ) : (
                    <div className="flex items-center justify-center h-[200px]">
                      <p>No data available</p>
                    </div>
                  )}
                </div>
                <div className="mt-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Age Group</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Male</TableHead>
                        <TableHead>Female</TableHead>
                        <TableHead>Percentage</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {ageDistribution.map((item, index) => {
                        const total = ageDistribution.reduce(
                          (sum, curr) => sum + curr.value,
                          0
                        );
                        const percentage = ((item.value / total) * 100).toFixed(
                          1
                        );
                        return (
                          <TableRow key={item.name}>
                            <TableCell className="flex items-center gap-2">
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{
                                  backgroundColor: `hsl(${
                                    index * (360 / ageDistribution.length)
                                  }, 70%, 60%)`,
                                }}
                              />
                              {item.name}
                            </TableCell>
                            <TableCell>{item.value}</TableCell>
                            <TableCell>{item.male}</TableCell>
                            <TableCell>{item.female}</TableCell>
                            <TableCell>{percentage}%</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
              <TabsContent value="location" className="space-y-4">
                <div className="h-[300px]">
                  {locationDistribution.length > 0 ? (
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
                          content={({ active, payload, label }) => {
                            if (active && payload && payload.length > 0) {
                              const data = payload[0].payload;
                              return (
                                <div className="bg-white p-2 rounded shadow text-xs">
                                  <p className="font-bold">{data.name}</p>
                                  <p>Total: {data.value}</p>
                                  <p>Male: {data.male}</p>
                                  <p>Female: {data.female}</p>
                                  <p>
                                    Percentage:{" "}
                                    {(
                                      (data.value / participants.length) *
                                      100
                                    ).toFixed(1)}
                                    %
                                  </p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[200px]">
                      <p>No data available</p>
                    </div>
                  )}
                </div>
                <div className="mt-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Location</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Male</TableHead>
                        <TableHead>Female</TableHead>
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
                            <TableCell>{item.male}</TableCell>
                            <TableCell>{item.female}</TableCell>
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
