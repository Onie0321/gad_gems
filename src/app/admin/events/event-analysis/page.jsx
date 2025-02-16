"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Calendar, Users, TrendingUp, Filter } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  databases,
  databaseId,
  eventCollectionId,
  studentsCollectionId,
  getCurrentAcademicPeriod,
} from "@/lib/appwrite";
import { Query } from "appwrite";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";

// Loading Skeleton Component
const AnalyticsSkeleton = () => (
  <div className="space-y-6">
    {/* Summary Cards Skeleton */}
    <div className="grid gap-4 md:grid-cols-4">
      {[...Array(4)].map((_, i) => (
        <Card key={i} className="p-6">
          <Skeleton className="h-8 w-24 mb-2" />
          <Skeleton className="h-10 w-32" />
        </Card>
      ))}
    </div>

    {/* Filter Section Skeleton */}
    <Card className="p-6">
      <Skeleton className="h-8 w-32 mb-4" />
      <div className="flex gap-4">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-10 w-40" />
        ))}
      </div>
    </Card>

    {/* Charts Skeleton */}
    <div className="grid gap-6 md:grid-cols-2">
      <Card className="p-6">
        <Skeleton className="h-8 w-32 mb-4" />
        <Skeleton className="h-[300px] w-full" />
      </Card>
      <Card className="p-6">
        <Skeleton className="h-8 w-32 mb-4" />
        <Skeleton className="h-[300px] w-full" />
      </Card>
    </div>
  </div>
);

// Custom Tooltip Component
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-4 rounded-lg shadow border">
        <p className="font-semibold">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} style={{ color: entry.color }}>
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function EventAnalysis() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalParticipants: 0,
    averageParticipants: 0,
    totalEvents: 0,
    genderStats: {
      male: 0,
      female: 0,
    },
    eventTypes: [],
    participantsByEvent: [],
    participantsByGender: [],
    participantsBySchool: [],
  });
  const [currentPeriod, setCurrentPeriod] = useState(null);
  const [filters, setFilters] = useState({
    eventType: "all",
    school: "all",
    gender: "all",
    timeRange: "year",
  });
  const [trendData, setTrendData] = useState([]);

  // Add summary metrics state
  const [summary, setSummary] = useState({
    totalEvents: 0,
    totalParticipants: 0,
    averageAttendance: 0,
    participationGrowth: 0,
  });

  const GENDER_COLORS = {
    Male: "#2196F3",
    Female: "#E91E63",
  };

  // Extended color palette for schools
  const SCHOOL_COLORS = [
    "#FF6B6B",
    "#4ECDC4",
    "#45B7D1",
    "#96CEB4",
    "#FFEEAD",
    "#D4A5A5",
    "#9B59B6",
    "#3498DB",
    "#F1C40F",
    "#E74C3C",
  ];

  // Function to calculate trend data
  const calculateTrendData = (events, participants) => {
    const eventsByMonth = events.reduce((acc, event) => {
      const date = new Date(event.eventDate);
      const monthYear = date.toLocaleString("default", {
        month: "short",
        year: "numeric",
      });

      if (!acc[monthYear]) {
        acc[monthYear] = {
          date: monthYear,
          events: 0,
          participants: 0,
          male: 0,
          female: 0,
        };
      }

      const eventParticipants = participants.filter(
        (p) => p.eventId === event.$id
      );
      acc[monthYear].events += 1;
      acc[monthYear].participants += eventParticipants.length;
      acc[monthYear].male += eventParticipants.filter(
        (p) => p.sex === "Male"
      ).length;
      acc[monthYear].female += eventParticipants.filter(
        (p) => p.sex === "Female"
      ).length;

      return acc;
    }, {});

    return Object.values(eventsByMonth).sort(
      (a, b) => new Date(a.date) - new Date(b.date)
    );
  };

  // Function to calculate summary metrics
  const calculateSummary = (events, participants) => {
    const totalEvents = events.length;
    const totalParticipants = participants.length;
    const averageAttendance =
      totalEvents > 0 ? totalParticipants / totalEvents : 0;

    // Calculate growth (compare last 2 months)
    const monthlyData = calculateTrendData(events, participants);
    const lastTwo = monthlyData.slice(-2);
    const participationGrowth =
      lastTwo.length === 2
        ? ((lastTwo[1].participants - lastTwo[0].participants) /
            lastTwo[0].participants) *
          100
        : 0;

    return {
      totalEvents,
      totalParticipants,
      averageAttendance: Math.round(averageAttendance),
      participationGrowth: Math.round(participationGrowth),
    };
  };

  const fetchEventStats = async () => {
    try {
      setLoading(true);
      // Get current academic period
      const period = await getCurrentAcademicPeriod();
      if (!period) {
        throw new Error("No active academic period found");
      }
      setCurrentPeriod(period);

      // First fetch all events
      const eventsResponse = await databases.listDocuments(
        databaseId,
        eventCollectionId,
        [
          Query.equal("isArchived", false),
          Query.equal("academicPeriodId", period.$id),
        ]
      );

      // Get all event IDs
      const eventIds = eventsResponse.documents.map((event) => event.$id);

      // Fetch all types of participants in parallel
      const [studentsResponse, staffResponse, communityResponse] =
        await Promise.all([
          databases.listDocuments(databaseId, studentsCollectionId, [
            Query.equal("isArchived", false),
            Query.equal("eventId", eventIds),
          ]),
          databases.listDocuments(databaseId, staffFacultyCollectionId, [
            Query.equal("isArchived", false),
            Query.equal("eventId", eventIds),
          ]),
          databases.listDocuments(databaseId, communityCollectionId, [
            Query.equal("isArchived", false),
            Query.equal("eventId", eventIds),
          ]),
        ]);

      // Combine all participants with their types
      const allParticipants = [
        ...studentsResponse.documents.map((p) => ({
          ...p,
          participantType: "Student",
        })),
        ...staffResponse.documents.map((p) => ({
          ...p,
          participantType: "Staff/Faculty",
        })),
        ...communityResponse.documents.map((p) => ({
          ...p,
          participantType: "Community Member",
        })),
      ];

      // Map events with their participants
      const events = eventsResponse.documents.map((event) => ({
        ...event,
        participants: allParticipants.filter((p) => p.eventId === event.$id),
      }));

      // Calculate gender counts across all participants
      const genderStats = allParticipants.reduce(
        (acc, participant) => {
          const gender = participant.sex.toLowerCase();
          acc[gender] = (acc[gender] || 0) + 1;
          return acc;
        },
        { male: 0, female: 0 }
      );

      // Calculate basic stats
      const totalEvents = events.length;
      const totalParticipants = allParticipants.length;
      const averageParticipants =
        totalEvents > 0 ? (totalParticipants / totalEvents).toFixed(1) : 0;

      // Process participants by event with detailed breakdown
      const participantsByEvent = events.map((event) => {
        const eventParticipants = event.participants || [];
        const breakdown = {
          name: event.eventName,
          date: event.eventDate,
          total: eventParticipants.length,
          male: eventParticipants.filter((p) => p.sex?.toLowerCase() === "male")
            .length,
          female: eventParticipants.filter(
            (p) => p.sex?.toLowerCase() === "female"
          ).length,
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
        return breakdown;
      });

      // Process school distribution
      const schoolData = allParticipants.reduce((acc, participant) => {
        if (participant.participantType === "Student") {
          const school = participant.school || "Not Specified";
          if (!acc[school]) {
            acc[school] = { male: 0, female: 0, total: 0 };
          }
          const gender = participant.sex?.toLowerCase();
          if (gender === "male") acc[school].male++;
          if (gender === "female") acc[school].female++;
          acc[school].total++;
        }
        return acc;
      }, {});

      const participantsBySchool = Object.entries(schoolData)
        .map(([name, counts]) => ({
          name,
          male: counts.male,
          female: counts.female,
          total: counts.total,
        }))
        .sort((a, b) => b.total - a.total);

      // Process event types
      const eventTypeCount = events.reduce((acc, event) => {
        const type = event.eventType || "Not Specified";
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {});

      const eventTypes = Object.entries(eventTypeCount)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);

      // Calculate trend data
      const trendData = calculateTrendData(events, allParticipants);
      setTrendData(trendData);

      // Calculate summary metrics
      const summaryMetrics = calculateSummary(events, allParticipants);
      setSummary(summaryMetrics);

      setStats({
        totalParticipants,
        averageParticipants,
        totalEvents,
        genderStats,
        eventTypes,
        participantsByEvent,
        participantsBySchool,
        participantTypes: {
          students: allParticipants.filter(
            (p) => p.participantType === "Student"
          ).length,
          staffFaculty: allParticipants.filter(
            (p) => p.participantType === "Staff/Faculty"
          ).length,
          community: allParticipants.filter(
            (p) => p.participantType === "Community Member"
          ).length,
        },
      });
    } catch (error) {
      console.error("Error fetching event statistics:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEventStats();
  }, []);

  if (loading) {
    return <AnalyticsSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Summary Section */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-blue-500" />
              <h3 className="text-sm font-medium">Total Events</h3>
            </div>
            <div className="mt-2">
              <p className="text-2xl font-bold">{summary.totalEvents}</p>
              <p className="text-xs text-muted-foreground">
                From {currentPeriod?.schoolYear}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-green-500" />
              <h3 className="text-sm font-medium">Total Participants</h3>
            </div>
            <div className="mt-2">
              <p className="text-2xl font-bold">{summary.totalParticipants}</p>
              <div className="text-xs text-muted-foreground">
                <span className="text-blue-500">
                  ♂ {stats.genderStats.male}
                </span>
                {" / "}
                <span className="text-pink-500">
                  ♀ {stats.genderStats.female}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-purple-500" />
              <h3 className="text-sm font-medium">Average Attendance</h3>
            </div>
            <div className="mt-2">
              <p className="text-2xl font-bold">{summary.averageAttendance}</p>
              <p className="text-xs text-muted-foreground">Per Event</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-orange-500" />
              <h3 className="text-sm font-medium">Growth Rate</h3>
            </div>
            <div className="mt-2">
              <p className="text-2xl font-bold">
                {summary.participationGrowth > 0 ? "+" : ""}
                {summary.participationGrowth}%
              </p>
              <p className="text-xs text-muted-foreground">Month over Month</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="flex gap-4">
          <Select
            value={filters.eventType}
            onValueChange={(value) =>
              setFilters((prev) => ({ ...prev, eventType: value }))
            }
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Event Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="academic">Academic</SelectItem>
              <SelectItem value="non-academic">Non-Academic</SelectItem>
            </SelectContent>
          </Select>
          {/* Add similar Select components for school and gender filters */}
        </CardContent>
      </Card>

      {/* Trend Line Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Participation Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="participants"
                  stroke="#8884d8"
                  name="Total Participants"
                />
                <Line
                  type="monotone"
                  dataKey="male"
                  stroke="#2196F3"
                  name="Male"
                />
                <Line
                  type="monotone"
                  dataKey="female"
                  stroke="#E91E63"
                  name="Female"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Event Type Distribution */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Event Type Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.eventTypes}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={({ name, percent }) =>
                      `${name} (${(percent * 100).toFixed(0)}%)`
                    }
                  >
                    {stats.eventTypes.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={SCHOOL_COLORS[index % SCHOOL_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Gender Distribution by School */}
        <Card>
          <CardHeader>
            <CardTitle>Gender Distribution by School</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.participantsBySchool}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="name"
                    angle={-45}
                    textAnchor="end"
                    height={70}
                  />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar dataKey="male" name="Male" fill={GENDER_COLORS.Male} />
                  <Bar
                    dataKey="female"
                    name="Female"
                    fill={GENDER_COLORS.Female}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Participants by Event */}
      <Card>
        <CardHeader>
          <CardTitle>Participants by Event</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.participantsByEvent}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="name"
                  angle={-45}
                  textAnchor="end"
                  height={100}
                  interval={0}
                />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar
                  dataKey="male"
                  name="Male"
                  stackId="a"
                  fill={GENDER_COLORS.Male}
                />
                <Bar
                  dataKey="female"
                  name="Female"
                  stackId="a"
                  fill={GENDER_COLORS.Female}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Statistics Table */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Event Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Event Name</TableHead>
                <TableHead className="text-right">Total Participants</TableHead>
                <TableHead className="text-right">Male</TableHead>
                <TableHead className="text-right">Female</TableHead>
                <TableHead className="text-right">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stats.participantsByEvent.map((event, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{event.name}</TableCell>
                  <TableCell className="text-right">{event.total}</TableCell>
                  <TableCell className="text-right text-blue-600">
                    {event.male}
                  </TableCell>
                  <TableCell className="text-right text-pink-600">
                    {event.female}
                  </TableCell>
                  <TableCell className="text-right">
                    {new Date(event.date).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
