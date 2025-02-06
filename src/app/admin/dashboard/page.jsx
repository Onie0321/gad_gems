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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

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
  const [pageSize, setPageSize] = useState(5);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState(null);
  const [sortDirection, setSortDirection] = useState("asc");
  const [locationPage, setLocationPage] = useState(1);
  const locationsPerPage = 5;

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

  // Add sorting function
  const sortEvents = (events) => {
    if (!sortField) return events;

    return [...events].sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];

      if (sortField === "eventDate") {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }

      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  };

  // Calculate pagination
  const totalPages = Math.ceil(eventsWithCreators.length / pageSize);
  const paginatedEvents = sortEvents(eventsWithCreators).slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Handle sort
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Add this function to get paginated locations
  const getPaginatedLocations = () => {
    const start = (locationPage - 1) * locationsPerPage;
    const end = start + locationsPerPage;
    return locationDistribution.slice(start, end);
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
                  variant="outline"
                  className="border-2 border-white/50 text-black "
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
              <div className="flex justify-between items-center mb-2">
                <span>Students:</span>
                <Badge className="border-2 border-white/50 bg-purple-500/20 text-black">
                  {participantTypeCounts.students}
                </Badge>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span>Staff/Faculty:</span>
                <Badge className="border-2 border-white/50 bg-purple-500/20 text-black">
                  {participantTypeCounts.staffFaculty}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span>Community Members:</span>
                <Badge className="border-2 border-white/50 bg-purple-500/20 text-black">
                  {participantTypeCounts.communityMembers}
                </Badge>
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
            <div className="flex items-center space-x-2">
              <span className="text-sm text-muted-foreground">Show:</span>
              <Select
                value={pageSize.toString()}
                onValueChange={(value) => setPageSize(Number(value))}
              >
                <SelectTrigger className="w-[80px]">
                  <SelectValue>{pageSize}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="15">15</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
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
                  <TableHead className="font-bold text-black">Source</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedEvents.map((event) => {
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
                      <TableCell>
                        <Badge
                          variant={
                            event.importedEvent ? "secondary" : "default"
                          }
                        >
                          {event.importedEvent ? "Imported" : "Created"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            <div className="flex items-center justify-end space-x-2 py-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                }
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
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
