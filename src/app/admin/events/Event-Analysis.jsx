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
  studentCollectionId,
  staffFacultyCollectionId,
  communityCollectionId,
  getCurrentAcademicPeriod,
  getEvents,
  getParticipants,
  getStaffFaculty,
  getCommunityMembers,
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
import { useToast } from "@/hooks/use-toast";

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
  const { toast } = useToast();
  const [filteredParticipants, setFilteredParticipants] = useState([]);
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
    participantsByType: [],
    participantsBySchool: [],
    participantsByOccupation: [],
  });
  const [currentPeriod, setCurrentPeriod] = useState(null);
  const [filters, setFilters] = useState({
    eventType: "all",
    participantType: "all",
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
        toast({
          title: "No Active Period",
          description:
            "No active academic period found. Please set up an academic period first.",
          variant: "destructive",
        });
        return;
      }
      setCurrentPeriod(period);

      // Fetch all events for the current period
      const events = await databases.listDocuments(
        databaseId,
        eventCollectionId,
        [
          Query.equal("isArchived", false),
          Query.equal("academicPeriodId", period.$id),
        ]
      );

      // Get all event IDs
      const eventIds = events.documents.map((event) => event.$id);

      // Fetch all types of participants in parallel with proper queries
      const [students, staffFaculty, communityMembers] = await Promise.all([
        databases.listDocuments(databaseId, studentCollectionId, [
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

      // Combine all participants with their types and additional info
      const allParticipants = [
        ...students.documents.map((p) => ({
          ...p,
          participantType: "Student",
          organization: p.school || "Not Specified",
          occupation: "Student",
          eventName:
            events.documents.find((e) => e.$id === p.eventId)?.eventName ||
            "Unknown Event",
        })),
        ...staffFaculty.documents.map((p) => ({
          ...p,
          participantType: "Staff/Faculty",
          organization: p.department || "Not Specified",
          occupation: p.position || "Staff/Faculty",
          eventName:
            events.documents.find((e) => e.$id === p.eventId)?.eventName ||
            "Unknown Event",
        })),
        ...communityMembers.documents.map((p) => ({
          ...p,
          participantType: "Community Member",
          organization: p.organization || "Not Specified",
          occupation: p.occupation || "Not Specified",
          eventName:
            events.documents.find((e) => e.$id === p.eventId)?.eventName ||
            "Unknown Event",
        })),
      ].filter((p) => eventIds.includes(p.eventId));

      // Apply filters if any
      let filtered = allParticipants;
      if (filters.participantType !== "all") {
        filtered = filtered.filter(
          (p) =>
            p.participantType.toLowerCase() ===
            filters.participantType.toLowerCase()
        );
      }
      if (filters.gender !== "all") {
        filtered = filtered.filter(
          (p) => p.sex?.toLowerCase() === filters.gender.toLowerCase()
        );
      }

      // Set filtered participants state
      setFilteredParticipants(filtered);

      // Calculate gender stats
      const genderStats = filtered.reduce(
        (acc, participant) => {
          const gender = participant.sex?.toLowerCase() || "not specified";
          acc[gender] = (acc[gender] || 0) + 1;
          return acc;
        },
        { male: 0, female: 0 }
      );

      // Process participants by type
      const participantTypeCount = filtered.reduce((acc, participant) => {
        const type = participant.participantType;
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {});

      const participantsByType = Object.entries(participantTypeCount)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);

      // Process participants by organization/school
      const organizationData = filtered.reduce((acc, participant) => {
        const org = participant.organization;
        if (!acc[org]) {
          acc[org] = {
            total: 0,
            byType: {},
            byGender: { male: 0, female: 0 },
          };
        }
        acc[org].total++;
        acc[org].byType[participant.participantType] =
          (acc[org].byType[participant.participantType] || 0) + 1;
        const gender = participant.sex?.toLowerCase();
        if (gender === "male") acc[org].byGender.male++;
        if (gender === "female") acc[org].byGender.female++;
        return acc;
      }, {});

      const participantsByOrganization = Object.entries(organizationData)
        .map(([name, data]) => ({
          name,
          total: data.total,
          ...data.byGender,
          ...data.byType,
        }))
        .sort((a, b) => b.total - a.total);

      // Process participants by occupation
      const occupationData = filtered.reduce((acc, participant) => {
        const occupation = participant.occupation;
        if (!acc[occupation]) {
          acc[occupation] = { total: 0, male: 0, female: 0 };
        }
        acc[occupation].total++;
        const gender = participant.sex?.toLowerCase();
        if (gender === "male") acc[occupation].male++;
        if (gender === "female") acc[occupation].female++;
        return acc;
      }, {});

      const participantsByOccupation = Object.entries(occupationData)
        .map(([name, counts]) => ({
          name,
          total: counts.total,
          male: counts.male,
          female: counts.female,
        }))
        .sort((a, b) => b.total - a.total);

      // Calculate trend data
      const trendData = calculateTrendData(events.documents, filtered);
      setTrendData(trendData);

      // Calculate summary metrics
      const summaryMetrics = calculateSummary(events.documents, filtered);
      setSummary(summaryMetrics);

      // Update all stats
      setStats({
        ...stats,
        participantsByType,
        participantsByOrganization,
        participantsByOccupation,
        genderStats,
        totalParticipants: filtered.length,
      });

      toast({
        title: "Data Loaded",
        description: `Successfully loaded data for ${period.schoolYear}`,
      });
    } catch (error) {
      console.error("Error fetching event statistics:", error);
      toast({
        title: "Error Loading Data",
        description:
          error.message || "Failed to load event statistics. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Add effect for filters
  useEffect(() => {
    const applyFilters = async () => {
      try {
        setLoading(true);
        await fetchEventStats();
      } catch (error) {
        console.error("Error applying filters:", error);
        toast({
          title: "Error",
          description: "Failed to apply filters. Please try again.",
          variant: "destructive",
        });
      }
    };

    applyFilters();
  }, [
    filters.eventType,
    filters.participantType,
    filters.gender,
    filters.timeRange,
  ]);

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
            value={filters.participantType}
            onValueChange={(value) =>
              setFilters((prev) => ({ ...prev, participantType: value }))
            }
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Participant Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="student">Students</SelectItem>
              <SelectItem value="staff/faculty">Staff/Faculty</SelectItem>
              <SelectItem value="community member">
                Community Members
              </SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filters.gender}
            onValueChange={(value) =>
              setFilters((prev) => ({ ...prev, gender: value }))
            }
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Gender" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Genders</SelectItem>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
            </SelectContent>
          </Select>
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

      {/* New Participant Distribution Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Participant Type Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.participantsByType}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={({ name, percent }) =>
                      `${name} (${(percent * 100).toFixed(0)}%)`
                    }
                  >
                    {stats.participantsByType.map((entry, index) => (
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

        <Card>
          <CardHeader>
            <CardTitle>Participants by Organization</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.participantsByOrganization.slice(0, 10)}>
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
      </div>

      {/* Detailed Statistics Table */}
      <Card>
        <CardHeader>
          <CardTitle>Participant Details</CardTitle>
          <p className="text-sm text-muted-foreground">
            Showing {Math.min(filteredParticipants.length, 100)} of{" "}
            {filteredParticipants.length} participants
          </p>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Organization</TableHead>
                <TableHead>Occupation</TableHead>
                <TableHead>Gender</TableHead>
                <TableHead>Event</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredParticipants.slice(0, 100).map((participant, index) => (
                <TableRow key={index}>
                  <TableCell>{participant.name}</TableCell>
                  <TableCell>{participant.participantType}</TableCell>
                  <TableCell>{participant.organization}</TableCell>
                  <TableCell>{participant.occupation}</TableCell>
                  <TableCell>{participant.sex}</TableCell>
                  <TableCell>{participant.eventName}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
