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
  Legend,
} from "recharts";
import {
  Calendar,
  Users,
  PieChartIcon,
  Users2,
  GraduationCap,
  UsersRound,
} from "lucide-react";
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
  TableCaption,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  userCollectionId,
  databaseId,
  databases,
  fetchTotals,
  eventCollectionId,
  studentsCollectionId,
  getCurrentAcademicPeriod,
  staffFacultyCollectionId,
  communityCollectionId,
} from "@/lib/appwrite";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { format, parseISO, formatDistanceToNow } from "date-fns";
import { client } from "@/lib/appwrite";

export default function DashboardOverview({
  users,
  participants,
  events,
  participantTotals,
}) {
  const [currentAcademicPeriod, setCurrentAcademicPeriod] = useState(null);
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
  const [pageSize, setPageSize] = useState(5);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState("createdAt");
  const [sortDirection, setSortDirection] = useState("desc");
  const [locationPage, setLocationPage] = useState(1);
  const locationsPerPage = 5;
  const [createdEvents, setCreatedEvents] = useState(0);
  const [importedEvents, setImportedEvents] = useState(0);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    const fetchAllParticipants = async () => {
      try {
        // Fetch all participants from each collection
        const [studentsResponse, staffFacultyResponse, communityResponse] =
          await Promise.all([
            databases.listDocuments(databaseId, studentsCollectionId, [
              Query.limit(1000), // Increased limit
            ]),
            databases.listDocuments(databaseId, staffFacultyCollectionId, [
              Query.limit(1000),
            ]),
            databases.listDocuments(databaseId, communityCollectionId, [
              Query.limit(1000),
            ]),
          ]);

        const counts = {
          students: studentsResponse.total,
          staffFaculty: staffFacultyResponse.total,
          communityMembers: communityResponse.total,
        };

        setParticipantTypeCounts(counts);
      } catch (error) {
        console.error("Error fetching participant counts:", error);
      }
    };

    fetchAllParticipants();
  }, []);

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

      // Fetch all participants from each collection with increased limit
      const [studentsResponse, staffFacultyResponse, communityResponse] =
        await Promise.all([
          databases.listDocuments(databaseId, studentsCollectionId, [
            Query.limit(1000),
          ]),
          databases.listDocuments(databaseId, staffFacultyCollectionId, [
            Query.limit(1000),
          ]),
          databases.listDocuments(databaseId, communityCollectionId, [
            Query.limit(1000),
          ]),
        ]);

      // Calculate sex distribution for each category
      const sexCounts = {
        students: {
          male: studentsResponse.documents.filter((p) => p.sex === "Male")
            .length,
          female: studentsResponse.documents.filter((p) => p.sex === "Female")
            .length,
          total: studentsResponse.total,
        },
        staffFaculty: {
          male: staffFacultyResponse.documents.filter((p) => p.sex === "Male")
            .length,
          female: staffFacultyResponse.documents.filter(
            (p) => p.sex === "Female"
          ).length,
          total: staffFacultyResponse.total,
        },
        community: {
          male: communityResponse.documents.filter((p) => p.sex === "Male")
            .length,
          female: communityResponse.documents.filter((p) => p.sex === "Female")
            .length,
          total: communityResponse.total,
        },
      };

      // Create sex distribution data
      const sexDistributionData = [
        {
          name: "Male",
          value:
            sexCounts.students.male +
            sexCounts.staffFaculty.male +
            sexCounts.community.male,
          details: {
            students: sexCounts.students.male,
            staffFaculty: sexCounts.staffFaculty.male,
            community: sexCounts.community.male,
          },
        },
        {
          name: "Female",
          value:
            sexCounts.students.female +
            sexCounts.staffFaculty.female +
            sexCounts.community.female,
          details: {
            students: sexCounts.students.female,
            staffFaculty: sexCounts.staffFaculty.female,
            community: sexCounts.community.female,
          },
        },
      ];

      // Set participant type counts
      const participantCounts = {
        students: sexCounts.students.total,
        staffFaculty: sexCounts.staffFaculty.total,
        communityMembers: sexCounts.community.total,
      };

      // Fetch events data and calculate event statistics
      const eventsResponse = await databases.listDocuments(
        databaseId,
        eventCollectionId,
        [Query.limit(1000)]
      );

      const totalEvents = eventsResponse.total;
      const academicEvents = eventsResponse.documents.filter(
        (event) => event.eventType === "Academic"
      ).length;
      const nonAcademicEvents = eventsResponse.documents.filter(
        (event) => event.eventType === "Non-Academic"
      ).length;
      const createdEvents = eventsResponse.documents.filter(
        (event) => event.source === "created"
      ).length;
      const importedEvents = eventsResponse.documents.filter(
        (event) => event.source === "imported"
      ).length;

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
      setTotalUsers(usersResponse.total);
      setPendingUsers(pendingCount);
      setApprovedUsers(approvedCount);
      setTotalEvents(totalEvents);
      setAcademicEvents(academicEvents);
      setNonAcademicEvents(nonAcademicEvents);
      setCreatedEvents(createdEvents);
      setImportedEvents(importedEvents);
      setSexDistribution(sexDistributionData);
      setParticipantTypeCounts(participantCounts);

      // Fetch other distributions
      const { ageDistribution, locationDistribution } = await fetchTotals(
        currentPeriod.$id
      );
      setAgeDistribution(ageDistribution);
      setLocationDistribution(locationDistribution);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Add sorting function
  const handleSort = (field) => {
    if (field === sortField) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const sortEvents = (events) => {
    // First sort all events
    const sortedEvents = [...events].sort((a, b) => {
      const multiplier = sortDirection === "asc" ? 1 : -1;

      switch (sortField) {
        case "eventName":
          return multiplier * a.eventName.localeCompare(b.eventName);
        case "eventDate":
          return multiplier * (new Date(a.eventDate) - new Date(b.eventDate));
        case "createdAt":
          return multiplier * (new Date(a.$createdAt) - new Date(b.$createdAt));
        default:
          // Default to showing latest first
          return new Date(b.$createdAt) - new Date(a.$createdAt);
      }
    });

    // Return only the first 5 events
    return sortedEvents.slice(0, 5);
  };

  // Add this function to get paginated locations
  const getPaginatedLocations = () => {
    const start = (locationPage - 1) * locationsPerPage;
    const end = start + locationsPerPage;
    return locationDistribution.slice(start, end);
  };

  // First, update the fetchData function to properly fetch all participants
  const fetchData = async (userId) => {
    try {
      setIsLoading(true);

      const currentPeriod = await getCurrentAcademicPeriod();
      setCurrentAcademicPeriod(currentPeriod);

      if (!currentPeriod) {
        throw new Error("No active academic period found");
      }

      // Fetch events
      const eventsResponse = await databases.listDocuments(
        databaseId,
        eventCollectionId,
        [
          Query.equal("isArchived", false),
          Query.equal("academicPeriodId", currentPeriod.$id),
          Query.orderDesc("$createdAt"),
          Query.limit(1000),
        ]
      );

      // Get all event IDs
      const eventIds = eventsResponse.documents.map((event) => event.$id);

      // Fetch all participants for these events
      const [studentsResponse, staffFacultyResponse, communityResponse] =
        await Promise.all([
          databases.listDocuments(databaseId, studentsCollectionId, [
            Query.equal("eventId", eventIds),
            Query.equal("isArchived", false),
          ]),
          databases.listDocuments(databaseId, staffFacultyCollectionId, [
            Query.equal("eventId", eventIds),
            Query.equal("isArchived", false),
          ]),
          databases.listDocuments(databaseId, communityCollectionId, [
            Query.equal("eventId", eventIds),
            Query.equal("isArchived", false),
          ]),
        ]);

      // Set all the data
      setEvents(eventsResponse.documents);
      setParticipants([
        ...studentsResponse.documents,
        ...staffFacultyResponse.documents,
        ...communityResponse.documents,
      ]);

      // Add debug logging
      console.log("Fetched Data:", {
        events: eventsResponse.documents.length,
        students: studentsResponse.documents.length,
        staffFaculty: staffFacultyResponse.documents.length,
        community: communityResponse.documents.length,
      });
    } catch (error) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Then update the getParticipantCounts function
  const getParticipantCounts = (eventId) => {
    const eventParticipants = participants.filter((p) => p.eventId === eventId);

    // Debug log to check participants
    console.log("Counting participants for event:", eventId, {
      totalParticipants: eventParticipants.length,
      participantDetails: eventParticipants.map((p) => ({
        collectionId: p.$collectionId,
        type: p.participantType,
        eventId: p.eventId,
      })),
    });

    // Count by participant type based on collection ID
    const studentCount = eventParticipants.filter(
      (p) => p.$collectionId === studentsCollectionId
    ).length;

    const staffFacultyCount = eventParticipants.filter(
      (p) => p.$collectionId === staffFacultyCollectionId
    ).length;

    const communityCount = eventParticipants.filter(
      (p) => p.$collectionId === communityCollectionId
    ).length;

    // Count by gender across all types
    const maleCount = eventParticipants.filter(
      (p) => p.sex && p.sex.toLowerCase() === "male"
    ).length;
    const femaleCount = eventParticipants.filter(
      (p) => p.sex && p.sex.toLowerCase() === "female"
    ).length;
    const totalCount = eventParticipants.length;

    // Get student details - only from students collection
    const students = eventParticipants.filter(
      (p) => p.$collectionId === studentsCollectionId
    );

    // Calculate student demographics
    const studentDemographics = {
      yearLevels: {},
      schools: {},
      ethnicGroups: {},
    };

    students.forEach((student) => {
      if (student.year) {
        studentDemographics.yearLevels[student.year] =
          (studentDemographics.yearLevels[student.year] || 0) + 1;
      }
      if (student.school) {
        studentDemographics.schools[student.school] =
          (studentDemographics.schools[student.school] || 0) + 1;
      }
      const ethnicGroup = student.ethnicGroup || "Not Specified";
      studentDemographics.ethnicGroups[ethnicGroup] =
        (studentDemographics.ethnicGroups[ethnicGroup] || 0) + 1;
    });

    return {
      total: totalCount,
      male: maleCount,
      female: femaleCount,
      students: studentCount,
      staffFaculty: staffFacultyCount,
      community: communityCount,
      demographics: studentDemographics,
    };
  };

  // Add real-time subscription for participants
  useEffect(() => {
    const unsubscribeCallbacks = [];

    const setupRealTimeSubscriptions = () => {
      // Subscribe to events updates
      const unsubscribeEvents = client.subscribe(
        `databases.${databaseId}.collections.${eventCollectionId}.documents`,
        (response) => {
          console.log("Event update received:", response);
          fetchData();
        }
      );
      unsubscribeCallbacks.push(unsubscribeEvents);

      // Subscribe to students updates
      const unsubscribeStudents = client.subscribe(
        `databases.${databaseId}.collections.${studentsCollectionId}.documents`,
        (response) => {
          console.log("Student update received:", response);
          fetchData();
        }
      );
      unsubscribeCallbacks.push(unsubscribeStudents);

      // Subscribe to staff/faculty updates
      const unsubscribeStaffFaculty = client.subscribe(
        `databases.${databaseId}.collections.${staffFacultyCollectionId}.documents`,
        (response) => {
          console.log("Staff/Faculty update received:", response);
          fetchData();
        }
      );
      unsubscribeCallbacks.push(unsubscribeStaffFaculty);

      // Subscribe to community updates
      const unsubscribeCommunity = client.subscribe(
        `databases.${databaseId}.collections.${communityCollectionId}.documents`,
        (response) => {
          console.log("Community update received:", response);
          fetchData();
        }
      );
      unsubscribeCallbacks.push(unsubscribeCommunity);
    };

    setupRealTimeSubscriptions();

    // Cleanup subscriptions
    return () => {
      unsubscribeCallbacks.forEach((unsubscribe) => unsubscribe());
    };
  }, []);

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
                  className="border-2 border-white/50 text-black"
                >
                  {academicEvents}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Non-Academic:</span>
                <Badge
                  variant="outline"
                  className="border-2 border-white/50 text-black"
                >
                  {nonAcademicEvents}
                </Badge>
              </div>
              <div className="border-t border-white/20 my-1" />
              <div className="flex items-center justify-between">
                <span>Created:</span>
                <Badge
                  variant="outline"
                  className="border-2 border-white/50 text-black"
                >
                  {createdEvents}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Imported:</span>
                <Badge
                  variant="outline"
                  className="border-2 border-white/50 text-black"
                >
                  {importedEvents}
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
              {participantTypeCounts.students +
                participantTypeCounts.staffFaculty +
                participantTypeCounts.communityMembers}
            </div>
            <div className="text-xs text-black mt-2">
              <div className="space-y-2">
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between items-center">
                    <span>Students:</span>
                    <div className="flex items-center gap-2">
                      <Badge className="border-2 border-white/50 bg-purple-500/20 text-black">
                        {participantTypeCounts.students}
                      </Badge>
                      <Badge className="bg-blue-500/20 text-blue-900 border-2 border-white/50">
                        {sexDistribution.find((d) => d.name === "Male")?.details
                          .students || 0}
                      </Badge>
                      <Badge className="bg-pink-500/20 text-pink-900 border-2 border-white/50">
                        {sexDistribution.find((d) => d.name === "Female")
                          ?.details.students || 0}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <div className="flex justify-between items-center">
                    <span>Staff/Faculty:</span>
                    <div className="flex items-center gap-2">
                      <Badge className="border-2 border-white/50 bg-purple-500/20 text-black">
                        {participantTypeCounts.staffFaculty}
                      </Badge>
                      <Badge className="bg-blue-500/20 text-blue-900 border-2 border-white/50">
                        {sexDistribution.find((d) => d.name === "Male")?.details
                          .staffFaculty || 0}
                      </Badge>
                      <Badge className="bg-pink-500/20 text-pink-900 border-2 border-white/50">
                        {sexDistribution.find((d) => d.name === "Female")
                          ?.details.staffFaculty || 0}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <div className="flex justify-between items-center">
                    <span>Community Members:</span>
                    <div className="flex items-center gap-2">
                      <Badge className="border-2 border-white/50 bg-purple-500/20 text-black">
                        {participantTypeCounts.communityMembers}
                      </Badge>
                      <Badge className="bg-blue-500/20 text-blue-900 border-2 border-white/50">
                        {sexDistribution.find((d) => d.name === "Male")?.details
                          .community || 0}
                      </Badge>
                      <Badge className="bg-pink-500/20 text-pink-900 border-2 border-white/50">
                        {sexDistribution.find((d) => d.name === "Female")
                          ?.details.community || 0}
                      </Badge>
                    </div>
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
            <div className="flex flex-col items-center">
              <div
                style={{ width: "120px", height: "80px", position: "relative" }}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={sexDistribution}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={25}
                      outerRadius={35}
                    >
                      {sexDistribution.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.name === "Male" ? "#2196F3" : "#E91E63"}
                        />
                      ))}
                    </Pie>
                    {sexDistribution.length > 0 && (
                      <text
                        x="50%"
                        y="50%"
                        textAnchor="middle"
                        dominantBaseline="middle"
                        className="text-[10px] font-medium fill-current"
                      >
                        {sexDistribution[0].total}
                      </text>
                    )}
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload[0]) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-white p-2 border rounded-lg shadow-lg">
                              <p className="font-bold text-sm">{data.name}</p>
                              <p className="text-sm">Total: {data.value}</p>
                              <div className="border-t mt-1 pt-1">
                                <p className="text-xs">
                                  Students: {data.details.students}
                                </p>
                                <p className="text-xs">
                                  Staff/Faculty: {data.details.staffFaculty}
                                </p>
                                <p className="text-xs">
                                  Community: {data.details.community}
                                </p>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-2 flex flex-col items-center gap-2">
                {sexDistribution
                  .sort((a, b) => (a.name === "Male" ? -1 : 1)) // Sort to ensure Male comes first
                  .map((entry, index) => (
                    <div
                      key={`stat-${index}`}
                      className="flex items-center justify-center w-full"
                    >
                      <div
                        className="w-2 h-2 mr-1 rounded-full"
                        style={{
                          backgroundColor:
                            entry.name === "Male" ? "#2196F3" : "#E91E63",
                        }}
                      ></div>
                      <span className="text-[11px] text-black mr-1">
                        {entry.name}:
                      </span>
                      <Badge
                        className={`border-2 border-white/50 text-[11px] px-2 py-0 h-5 ${
                          entry.name === "Male"
                            ? "bg-blue-500/20 text-blue-900"
                            : "bg-pink-500/20 text-pink-900"
                        }`}
                      >
                        {entry.value}
                      </Badge>
                    </div>
                  ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="mt-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Events</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableCaption>Showing 5 most recent events</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead
                    className="font-bold text-black cursor-pointer"
                    onClick={() => handleSort("eventName")}
                  >
                    Event Name{" "}
                    {sortField === "eventName" &&
                      (sortDirection === "asc" ? "↑" : "↓")}
                  </TableHead>
                  <TableHead
                    className="font-bold text-black cursor-pointer"
                    onClick={() => handleSort("eventDate")}
                  >
                    Date{" "}
                    {sortField === "eventDate" &&
                      (sortDirection === "asc" ? "↑" : "↓")}
                  </TableHead>
                  <TableHead className="font-bold text-black">
                    Location
                  </TableHead>
                  <TableHead className="text-center font-bold text-black">
                    Participants
                  </TableHead>
                  <TableHead className="font-bold text-black">
                    Created By
                  </TableHead>
                  <TableHead
                    className="font-bold text-black cursor-pointer"
                    onClick={() => handleSort("createdAt")}
                  >
                    Created At{" "}
                    {sortField === "createdAt" &&
                      (sortDirection === "asc" ? "↑" : "↓")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortEvents(eventsWithCreators).map((event) => {
                  const counts = getParticipantCounts(event.$id);

                  return (
                    <TableRow key={event.$id}>
                      <TableCell className="font-medium">
                        {event.eventName}
                      </TableCell>
                      <TableCell>
                        {format(new Date(event.eventDate), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell>{event.eventVenue}</TableCell>
                      <TableCell className="text-center">
                        <div className="flex flex-col items-center">
                          <div className="font-medium">
                            Total: {counts.total}
                          </div>
                          <div className="text-sm">
                            <span className="text-blue-600 font-medium">
                              {counts.male}
                            </span>
                            <span className="mx-1">/</span>
                            <span className="text-pink-600 font-medium">
                              {counts.female}
                            </span>
                          </div>
                          <div className="text-xs space-x-1 text-muted-foreground">
                            <span
                              title={`Students\n${Object.entries(
                                counts.demographics.yearLevels
                              )
                                .map(([year, count]) => `${year}: ${count}`)
                                .join("\n")}`}
                              className="inline-flex items-center hover:bg-gray-100 rounded px-1"
                            >
                              <GraduationCap className="h-3 w-3 mr-0.5" />
                              {counts.students}
                            </span>
                            <span>|</span>
                            <span
                              title="Staff/Faculty"
                              className="inline-flex items-center hover:bg-gray-100 rounded px-1"
                            >
                              <Users className="h-3 w-3 mr-0.5" />
                              {counts.staffFaculty}
                            </span>
                            <span>|</span>
                            <span
                              title="Community"
                              className="inline-flex items-center hover:bg-gray-100 rounded px-1"
                            >
                              <UsersRound className="h-3 w-3 mr-0.5" />
                              {counts.community}
                            </span>
                          </div>
                          {counts.students > 0 && (
                            <div className="text-xs mt-1 text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <span className="font-medium">Schools:</span>
                                {Object.entries(counts.demographics.schools)
                                  .slice(0, 2)
                                  .map(([school, count], index) => (
                                    <Badge
                                      key={school}
                                      variant="outline"
                                      className="text-[10px] h-4"
                                      title={`${school}: ${count}`}
                                    >
                                      {school.slice(0, 10)}... ({count})
                                    </Badge>
                                  ))}
                                {Object.keys(counts.demographics.schools)
                                  .length > 2 && (
                                  <Badge
                                    variant="outline"
                                    className="text-[10px] h-4"
                                    title={Object.entries(
                                      counts.demographics.schools
                                    )
                                      .slice(2)
                                      .map(
                                        ([school, count]) =>
                                          `${school}: ${count}`
                                      )
                                      .join("\n")}
                                  >
                                    +
                                    {Object.keys(counts.demographics.schools)
                                      .length - 2}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{event.createdByName}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-sm">
                            {format(
                              parseISO(event.$createdAt),
                              "MMM d, yyyy h:mm a"
                            )}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(parseISO(event.$createdAt), {
                              addSuffix: true,
                            })}
                          </span>
                        </div>
                      </TableCell>
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
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 12 }}
                        interval={0}
                        angle={-15}
                        textAnchor="end"
                      />
                      <YAxis />
                      <Tooltip
                        content={({ active, payload, label }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="bg-white p-2 border rounded-lg shadow-lg">
                                <p className="font-bold">{label}</p>
                                <p className="text-blue-600">
                                  Male: {payload[0].value}
                                </p>
                                <p className="text-pink-600">
                                  Female: {payload[1].value}
                                </p>
                                <p className="text-gray-600 border-t mt-1 pt-1">
                                  Total: {payload[0].value + payload[1].value}
                                </p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Legend />
                      <Bar
                        name="Male"
                        dataKey="male"
                        stackId="a"
                        fill="#2196F3"
                      >
                        {ageDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill="#2196F3" />
                        ))}
                      </Bar>
                      <Bar
                        name="Female"
                        dataKey="female"
                        stackId="a"
                        fill="#E91E63"
                      >
                        {ageDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill="#E91E63" />
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
                        data={getPaginatedLocations()}
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
                        {getPaginatedLocations().map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={`hsl(${
                              index * (360 / getPaginatedLocations().length)
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
                        <TableHead>Male</TableHead>
                        <TableHead>Female</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Percentage</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {getPaginatedLocations().map((item, index) => {
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
                                    index *
                                    (360 / getPaginatedLocations().length)
                                  }, 70%, 60%)`,
                                }}
                              />
                              {item.name}
                            </TableCell>
                            <TableCell>
                              <Badge className="bg-blue-500/20 text-blue-700 border-2 border-white/50">
                                {item.male || 0}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge className="bg-pink-500/20 text-pink-700 border-2 border-white/50">
                                {item.female || 0}
                              </Badge>
                            </TableCell>
                            <TableCell>{item.value}</TableCell>
                            <TableCell>{percentage}%</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                  <div className="flex items-center justify-end space-x-2 py-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setLocationPage((prev) => Math.max(1, prev - 1))
                      }
                      disabled={locationPage === 1}
                    >
                      Previous
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      Page {locationPage} of{" "}
                      {Math.ceil(
                        locationDistribution.length / locationsPerPage
                      )}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setLocationPage((prev) =>
                          Math.min(
                            Math.ceil(
                              locationDistribution.length / locationsPerPage
                            ),
                            prev + 1
                          )
                        )
                      }
                      disabled={
                        locationPage ===
                        Math.ceil(
                          locationDistribution.length / locationsPerPage
                        )
                      }
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
