"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
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
  Sector,
} from "recharts";
import {
  Calendar,
  Users,
  PieChartIcon,
  Users2,
  Loader2,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
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
import { Button } from "@/components/ui/button";
import {
  categorizeLuzonLocation,
  luzonLocations,
} from "@/app/admin/demographics/search/constants";
import { Skeleton } from "@/components/ui/skeleton";

// Skeleton Components for Dashboard
const StatsCardSkeleton = () => (
  <Card className="bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-4 w-4 rounded" />
    </CardHeader>
    <CardContent>
      <Skeleton className="h-8 w-16 mb-2" />
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-5 w-12" />
        </div>
        <div className="flex items-center justify-between">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-5 w-12" />
        </div>
        <div className="flex items-center justify-between">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-5 w-12" />
        </div>
      </div>
    </CardContent>
  </Card>
);

const ChartSkeleton = ({ height = "300px" }) => (
  <div className="h-[300px] flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-lg">
    <div className="text-center">
      <Skeleton className="h-8 w-32 mx-auto mb-2" />
      <Skeleton className="h-4 w-24 mx-auto" />
    </div>
  </div>
);

const TableSkeleton = ({ rows = 5, columns = 7 }) => (
  <div className="space-y-3">
    <div className="flex items-center justify-between">
      <Skeleton className="h-6 w-32" />
    </div>
    <div className="border rounded-lg">
      <div className="p-4 border-b">
        <div className="grid grid-cols-7 gap-4">
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton key={i} className="h-4 w-full" />
          ))}
        </div>
      </div>
      <div className="divide-y">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="p-4">
            <div className="grid grid-cols-7 gap-4">
              {Array.from({ length: columns }).map((_, colIndex) => (
                <Skeleton key={colIndex} className="h-4 w-full" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const PieChartSkeleton = () => (
  <div className="h-[120px] flex items-center justify-center">
    <div className="text-center">
      <Skeleton className="h-16 w-16 rounded-full mx-auto mb-2" />
      <Skeleton className="h-3 w-20 mx-auto" />
    </div>
  </div>
);

export default function DashboardOverview({
  users,
  participants,
  events,
  participantTotals,
  onNavigate,
}) {
  console.log("[Dashboard] Component received props:", {
    usersCount: users?.length || 0,
    participantsCount: participants?.length || 0,
    eventsCount: events?.length || 0,
    participantTotals,
  });

  // Debug: Log when participants prop changes
  useEffect(() => {
    console.log("[Dashboard] Participants prop changed:", {
      count: participants?.length || 0,
      sampleData: participants?.slice(0, 3).map((p) => ({
        participantType: p.participantType,
        sex: p.sex,
        id: p.$id,
      })),
    });
  }, [participants]);

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
  const [hasData, setHasData] = useState(false);
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
  const [ethnicDistribution, setEthnicDistribution] = useState([]);
  const [currentPeriod, setCurrentPeriod] = useState(null);
  const [sunburstData, setSunburstData] = useState({ data: [], total: 0 });
  const [activeIndex, setActiveIndex] = useState(null);
  const [expandedProvinces, setExpandedProvinces] = useState(new Set());

  // Generate distinct colors for provinces
  const provinceColors = [
    "#8884d8",
    "#82ca9d",
    "#ffc658",
    "#ff7300",
    "#ff0000",
    "#00ff00",
    "#0000ff",
    "#ffff00",
    "#ff00ff",
    "#00ffff",
    "#800080",
    "#008000",
    "#000080",
    "#808000",
    "#800080",
    "#008080",
    "#ffa500",
    "#a52a2a",
    "#deb887",
    "#5f9ea0",
  ];

  // Handle province click to expand/collapse municipalities
  const handleProvinceClick = useCallback((provinceName) => {
    setExpandedProvinces((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(provinceName)) {
        newSet.delete(provinceName);
      } else {
        newSet.add(provinceName);
      }
      return newSet;
    });
  }, []);

  useEffect(() => {
    const processData = async () => {
      if (!users || !events || !participants) {
        console.log("[Dashboard] Missing required data, skipping processing");
        return;
      }

      try {
        console.log("[Dashboard] Starting to process data...");
        setIsLoading(true);
        setError(null);

        // Get current academic period
        console.log("[Dashboard] Fetching current academic period...");
        const currentPeriod = await getCurrentAcademicPeriod();
        console.log("[Dashboard] Current period result:", currentPeriod);
        setCurrentPeriod(currentPeriod);

        if (!currentPeriod) {
          console.log("[Dashboard] No academic period found");
          setError("No active academic period found");
          setIsLoading(false);
          return;
        }

        console.log("[Dashboard] Processing user data...");
        // Calculate statistics from props
        const pendingCount = users.filter(
          (user) => user.approvalStatus === "pending"
        ).length;

        const approvedCount = users.filter(
          (user) => user.approvalStatus === "approved"
        ).length;

        // Update states
        setTotalUsers(users.length);
        setPendingUsers(pendingCount);
        setApprovedUsers(approvedCount);
        setTotalEvents(events.length);
        setAcademicEvents(
          events.filter((e) => e.eventType === "Academic").length
        );
        setNonAcademicEvents(
          events.filter((e) => e.eventType === "Non-Academic").length
        );

        // Check if we have any data
        const hasAnyData =
          users.length > 0 || events.length > 0 || participants.length > 0;
        console.log("[Dashboard] Has data:", hasAnyData);
        setHasData(hasAnyData);

        // Calculate distributions
        console.log("[Dashboard] Calculating distributions...");
        const ethnicDistribution = calculateEthnicDistribution(participants);
        setEthnicDistribution(ethnicDistribution);

        // Calculate participant type counts
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
        console.log("[Dashboard] Participant counts:", counts);
        setParticipantTypeCounts(counts);

        // Process events with creators
        console.log("[Dashboard] Processing events with creators...");
        const eventsWithDetails = events
          .sort((a, b) => new Date(b.$createdAt) - new Date(a.$createdAt))
          .slice(0, 5)
          .map((event) => {
            const creator = users.find((user) => user.$id === event.createdBy);
            return {
              ...event,
              createdByName: creator?.name || "Unknown User",
            };
          });
        setEventsWithCreators(eventsWithDetails);

        // Calculate user statistics
        console.log("[Dashboard] Calculating user statistics...");
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const active = users.filter(
          (user) => new Date(user.lastLogin || user.$createdAt) > thirtyDaysAgo
        ).length;

        setActiveUsers(active);
        setInactiveUsers(users.length - active);

        const verified = users.filter((user) => user.emailVerification).length;
        setVerifiedUsers(verified);
        setUnverifiedUsers(users.length - verified);

        console.log("[Dashboard] Data processing completed successfully");
      } catch (error) {
        console.error("[Dashboard] Error processing data:", error);
        setError(error.message);
      } finally {
        console.log("[Dashboard] Setting loading to false");
        setIsLoading(false);
      }
    };

    processData();
  }, [users, events, participants]);

  useEffect(() => {
    // Calculate total male/female counts across all participants
    if (!participants || participants.length === 0) {
      console.log(
        "[Dashboard] No participants data available for sex distribution"
      );
      return;
    }

    console.log(
      `[Dashboard] Calculating sex distribution for ${participants.length} participants`
    );

    // Log some sample data to debug
    const sampleParticipants = participants.slice(0, 5);
    console.log(
      "[Dashboard] Sample participants:",
      sampleParticipants.map((p) => ({
        participantType: p.participantType,
        sex: p.sex,
        id: p.$id,
      }))
    );

    // Check for all unique sex values to debug
    const uniqueSexValues = [...new Set(participants.map((p) => p.sex))];
    console.log("[Dashboard] Unique sex values found:", uniqueSexValues);

    // Check actual field names in the data
    if (participants.length > 0) {
      const firstParticipant = participants[0];
      console.log(
        "[Dashboard] Available fields in participant data:",
        Object.keys(firstParticipant)
      );
      console.log("[Dashboard] First participant full data:", firstParticipant);
    }

    // Check for all unique participant type values to debug
    const uniqueParticipantTypes = [
      ...new Set(participants.map((p) => p.participantType)),
    ];
    console.log(
      "[Dashboard] Unique participant types found:",
      uniqueParticipantTypes
    );

    // Count by exact values first
    const maleCount = participants.filter((p) => p.sex === "Male").length;
    const femaleCount = participants.filter((p) => p.sex === "Female").length;

    // Also count by case-insensitive values
    const maleCountCI = participants.filter(
      (p) => p.sex?.toLowerCase() === "male"
    ).length;
    const femaleCountCI = participants.filter(
      (p) => p.sex?.toLowerCase() === "female"
    ).length;

    console.log(
      `[Dashboard] Sex counts - Male: ${maleCount}, Female: ${femaleCount}`
    );
    console.log(
      `[Dashboard] Sex counts (case-insensitive) - Male: ${maleCountCI}, Female: ${femaleCountCI}`
    );

    // Count by participant type to see distribution
    const students = participants.filter(
      (p) => p.participantType === "Student"
    );
    const staffFaculty = participants.filter(
      (p) => p.participantType === "Staff/Faculty"
    );
    const community = participants.filter(
      (p) => p.participantType === "Community Member"
    );

    console.log(`[Dashboard] Participant type distribution:`, {
      students: students.length,
      staffFaculty: staffFaculty.length,
      community: community.length,
    });

    // Check sex distribution within each participant type
    console.log(`[Dashboard] Sex distribution by type:`, {
      students: {
        male: students.filter((p) => p.sex?.toLowerCase() === "male").length,
        female: students.filter((p) => p.sex?.toLowerCase() === "female")
          .length,
        other: students.filter(
          (p) =>
            !p.sex ||
            (p.sex?.toLowerCase() !== "male" &&
              p.sex?.toLowerCase() !== "female")
        ).length,
      },
      staffFaculty: {
        male: staffFaculty.filter((p) => p.sex?.toLowerCase() === "male")
          .length,
        female: staffFaculty.filter((p) => p.sex?.toLowerCase() === "female")
          .length,
        other: staffFaculty.filter(
          (p) =>
            !p.sex ||
            (p.sex?.toLowerCase() !== "male" &&
              p.sex?.toLowerCase() !== "female")
        ).length,
      },
      community: {
        male: community.filter((p) => p.sex?.toLowerCase() === "male").length,
        female: community.filter((p) => p.sex?.toLowerCase() === "female")
          .length,
        other: community.filter(
          (p) =>
            !p.sex ||
            (p.sex?.toLowerCase() !== "male" &&
              p.sex?.toLowerCase() !== "female")
        ).length,
      },
    });

    // Use case-insensitive comparison for more robust counting
    const maleStudents = participants.filter(
      (p) => p.participantType === "Student" && p.sex?.toLowerCase() === "male"
    ).length;
    const maleStaffFaculty = participants.filter(
      (p) =>
        p.participantType === "Staff/Faculty" && p.sex?.toLowerCase() === "male"
    ).length;
    const maleCommunity = participants.filter(
      (p) =>
        p.participantType === "Community Member" &&
        p.sex?.toLowerCase() === "male"
    ).length;
    const femaleStudents = participants.filter(
      (p) =>
        p.participantType === "Student" && p.sex?.toLowerCase() === "female"
    ).length;
    const femaleStaffFaculty = participants.filter(
      (p) =>
        p.participantType === "Staff/Faculty" &&
        p.sex?.toLowerCase() === "female"
    ).length;
    const femaleCommunity = participants.filter(
      (p) =>
        p.participantType === "Community Member" &&
        p.sex?.toLowerCase() === "female"
    ).length;

    console.log(`[Dashboard] Detailed counts:`, {
      maleStudents,
      maleStaffFaculty,
      maleCommunity,
      femaleStudents,
      femaleStaffFaculty,
      femaleCommunity,
    });

    const newSexDistribution = [
      {
        name: "Male",
        value: maleCountCI, // Use case-insensitive count
        details: {
          students: maleStudents,
          staffFaculty: maleStaffFaculty,
          community: maleCommunity,
        },
      },
      {
        name: "Female",
        value: femaleCountCI, // Use case-insensitive count
        details: {
          students: femaleStudents,
          staffFaculty: femaleStaffFaculty,
          community: femaleCommunity,
        },
      },
    ];

    console.log("[Dashboard] Final sex distribution:", newSexDistribution);

    // Summary log
    const totalCounted = maleCountCI + femaleCountCI;
    const totalParticipants = participants.length;
    console.log(
      `[Dashboard] Summary: ${totalCounted} participants counted out of ${totalParticipants} total participants`
    );

    setSexDistribution(newSexDistribution);
  }, [participants]);

  const calculateAgeDistribution = (participants) => {
    // Initialize age groups with counts
    const ageGroups = {
      "Below 18": { male: 0, female: 0, total: 0 },
      "18-24": { male: 0, female: 0, total: 0 },
      "25-34": { male: 0, female: 0, total: 0 },
      "35-44": { male: 0, female: 0, total: 0 },
      "45-54": { male: 0, female: 0, total: 0 },
      "Above 55": { male: 0, female: 0, total: 0 },
    };

    // Count participants in each age group
    let totalMale = 0;
    let totalFemale = 0;
    let grandTotal = 0;

    participants.forEach((participant) => {
      const age = parseInt(participant.age);
      const sex = participant.sex?.toLowerCase() || "unknown";

      if (isNaN(age)) return;

      let ageGroup;
      if (age < 18) ageGroup = "Below 18";
      else if (age <= 24) ageGroup = "18-24";
      else if (age <= 34) ageGroup = "25-34";
      else if (age <= 44) ageGroup = "35-44";
      else if (age <= 54) ageGroup = "45-54";
      else ageGroup = "Above 55";

      // Update totals
      if (sex === "male") {
        totalMale++;
        ageGroups[ageGroup].male++;
      } else if (sex === "female") {
        totalFemale++;
        ageGroups[ageGroup].female++;
      }
      ageGroups[ageGroup].total++;
      grandTotal++;
    });

    const distribution = Object.entries(ageGroups).map(([name, counts]) => ({
      name,
      value: counts.total,
      male: counts.male,
      female: counts.female,
    }));

    // Add total row
    distribution.push({
      name: "Total",
      value: grandTotal,
      male: totalMale,
      female: totalFemale,
    });

    return distribution;
  };

  const calculateLocationDistribution = (participants) => {
    // Create a map to store location counts
    const locationCounts = new Map();
    let totalMale = 0;
    let totalFemale = 0;
    let grandTotal = 0;

    participants.forEach((participant) => {
      const address = participant.address?.trim() || "Not Specified";
      const sex = participant.sex?.toLowerCase() || "unknown";
      const type = participant.participantType;

      // Use the new Luzon location categorization
      const categorizedLocation = categorizeLuzonLocation(address);

      if (!locationCounts.has(categorizedLocation)) {
        locationCounts.set(categorizedLocation, {
          male: 0,
          female: 0,
          total: 0,
          students: 0,
          staffFaculty: 0,
          community: 0,
        });
      }

      const counts = locationCounts.get(categorizedLocation);
      counts.total++;
      grandTotal++;

      if (sex === "male") {
        counts.male++;
        totalMale++;
      } else if (sex === "female") {
        counts.female++;
        totalFemale++;
      }

      // Count by participant type
      if (type === "Student") counts.students++;
      else if (type === "Staff/Faculty") counts.staffFaculty++;
      else if (type === "Community Member") counts.community++;
    });

    const distribution = Array.from(locationCounts, ([name, counts]) => ({
      name,
      value: counts.total,
      male: counts.male,
      female: counts.female,
      details: {
        students: counts.students,
        staffFaculty: counts.staffFaculty,
        community: counts.community,
      },
    }));

    // Add total row
    distribution.push({
      name: "Total",
      value: grandTotal,
      male: totalMale,
      female: totalFemale,
      details: {
        students: distribution.reduce(
          (sum, item) => sum + item.details.students,
          0
        ),
        staffFaculty: distribution.reduce(
          (sum, item) => sum + item.details.staffFaculty,
          0
        ),
        community: distribution.reduce(
          (sum, item) => sum + item.details.community,
          0
        ),
      },
    });

    return distribution;
  };

  const calculateEthnicDistribution = (participants) => {
    // Create a map to store ethnic group counts
    const ethnicCounts = new Map();
    let totalMale = 0;
    let totalFemale = 0;
    let grandTotal = 0;

    participants.forEach((participant) => {
      const ethnicGroup =
        participant.ethnicGroup?.trim() ||
        participant.otherEthnicGroup?.trim() ||
        "Unspecified";
      const sex = participant.sex?.toLowerCase() || "unknown";
      const type = participant.participantType;

      if (!ethnicCounts.has(ethnicGroup)) {
        ethnicCounts.set(ethnicGroup, {
          male: 0,
          female: 0,
          total: 0,
          students: 0,
          staffFaculty: 0,
          community: 0,
        });
      }

      const counts = ethnicCounts.get(ethnicGroup);
      counts.total++;
      grandTotal++;

      if (sex === "male") {
        counts.male++;
        totalMale++;
      } else if (sex === "female") {
        counts.female++;
        totalFemale++;
      }

      // Count by participant type
      if (type === "Student") counts.students++;
      else if (type === "Staff/Faculty") counts.staffFaculty++;
      else if (type === "Community Member") counts.community++;
    });

    // Convert to array format for the chart
    const distribution = Array.from(ethnicCounts, ([name, counts]) => ({
      name,
      value: counts.total,
      male: counts.male,
      female: counts.female,
      details: {
        students: counts.students,
        staffFaculty: counts.staffFaculty,
        community: counts.community,
      },
    }));

    // Add total row
    distribution.push({
      name: "Total",
      value: grandTotal,
      male: totalMale,
      female: totalFemale,
      details: {
        students: distribution.reduce(
          (sum, item) => sum + item.details.students,
          0
        ),
        staffFaculty: distribution.reduce(
          (sum, item) => sum + item.details.staffFaculty,
          0
        ),
        community: distribution.reduce(
          (sum, item) => sum + item.details.community,
          0
        ),
      },
    });

    return distribution;
  };

  useEffect(() => {
    if (
      !participants ||
      participants.length === 0 ||
      ageDistribution.length > 0
    ) {
      return;
    }

    const newAgeDistribution = calculateAgeDistribution(participants);
    setAgeDistribution(newAgeDistribution);
  }, [participants, ageDistribution]);

  useEffect(() => {
    if (
      !participants ||
      participants.length === 0 ||
      locationDistribution.length > 0
    ) {
      return;
    }

    const newLocationDistribution = calculateLocationDistribution(participants);
    setLocationDistribution(newLocationDistribution);
  }, [participants, locationDistribution]);

  useEffect(() => {
    if (
      !participants ||
      participants.length === 0 ||
      ethnicDistribution.length > 0
    ) {
      return;
    }

    const newEthnicDistribution = calculateEthnicDistribution(participants);
    setEthnicDistribution(newEthnicDistribution);
  }, [participants, ethnicDistribution]);

  useEffect(() => {
    if (
      !participants ||
      participants.length === 0 ||
      sunburstData.data.length > 0
    ) {
      return;
    }

    const newSunburstData = transformLocationDataForSunburst(participants);
    setSunburstData(newSunburstData);
  }, [participants, sunburstData.data.length]);

  // Sunburst Chart Component
  const SunburstChart = React.memo(({ data, total }) => {
    // Remove activeIndex state to prevent unnecessary re-renders
    const [hoveredIndex, setHoveredIndex] = useState(null);

    // Memoize the flattened data to prevent recalculation on every render
    const flattenedData = useMemo(() => {
      return data.flatMap((province, provinceIndex) => {
        const provinceColor =
          provinceColors[provinceIndex % provinceColors.length];
        const provinceSegment = {
          name: province.name,
          value: province.value,
          male: province.male,
          female: province.female,
          students: province.students,
          staffFaculty: province.staffFaculty,
          community: province.community,
          fill: provinceColor,
          level: "province",
          provinceIndex,
        };

        // Add municipality segments
        const municipalitySegments = province.children.map(
          (municipality, municipalityIndex) => ({
            name: municipality.name,
            value: municipality.value,
            male: municipality.male,
            female: municipality.female,
            students: municipality.students,
            staffFaculty: municipality.staffFaculty,
            community: municipality.community,
            fill: provinceColor, // Same color as province but will be in outer ring
            level: "municipality",
            provinceIndex,
            municipalityIndex,
          })
        );

        return [provinceSegment, ...municipalitySegments];
      });
    }, [data]);

    const renderActiveShape = useCallback((props) => {
      const {
        cx,
        cy,
        innerRadius,
        outerRadius,
        startAngle,
        endAngle,
        fill,
        payload,
      } = props;

      return (
        <g>
          <text
            x={cx}
            y={cy}
            dy={8}
            textAnchor="middle"
            fill="#fff"
            fontSize={12}
            fontWeight="bold"
          >
            {payload.name}
          </text>
          <Sector
            cx={cx}
            cy={cy}
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            startAngle={startAngle}
            endAngle={endAngle}
            fill={fill}
          />
          <Sector
            cx={cx}
            cy={cy}
            startAngle={startAngle}
            endAngle={endAngle}
            innerRadius={outerRadius + 6}
            outerRadius={outerRadius + 10}
            fill={fill}
          />
        </g>
      );
    }, []);

    const onPieEnter = useCallback((_, index) => {
      setHoveredIndex(index);
    }, []);

    const onPieLeave = useCallback(() => {
      setHoveredIndex(null);
    }, []);

    return (
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          {/* Inner ring - Provinces */}
          <Pie
            activeIndex={hoveredIndex}
            activeShape={renderActiveShape}
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={40}
            outerRadius={80}
            dataKey="value"
            onMouseEnter={onPieEnter}
            onMouseLeave={onPieLeave}
          >
            {data.map((entry, index) => (
              <Cell
                key={`province-${index}`}
                fill={provinceColors[index % provinceColors.length]}
              />
            ))}
          </Pie>

          {/* Outer ring - Municipalities */}
          <Pie
            data={flattenedData.filter((item) => item.level === "municipality")}
            cx="50%"
            cy="50%"
            innerRadius={90}
            outerRadius={140}
            dataKey="value"
            onMouseEnter={onPieEnter}
            onMouseLeave={onPieLeave}
          >
            {flattenedData
              .filter((item) => item.level === "municipality")
              .map((entry, index) => (
                <Cell
                  key={`municipality-${index}`}
                  fill={entry.fill}
                  opacity={0.8}
                />
              ))}
          </Pie>

          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length > 0) {
                const data = payload[0].payload;
                const percentage = ((data.value / total) * 100).toFixed(1);
                return (
                  <div className="bg-gray-900 text-white p-3 rounded-lg shadow-lg border border-gray-700">
                    <p className="font-bold text-sm mb-2">{data.name}</p>
                    <div className="space-y-1 text-xs">
                      <p>
                        Total: {data.value} ({percentage}%)
                      </p>
                      <p>Male: {data.male}</p>
                      <p>Female: {data.female}</p>
                      <div className="border-t border-gray-600 pt-1 mt-2">
                        <p className="font-semibold text-xs mb-1">By Type:</p>
                        <p>Students: {data.students}</p>
                        <p>Staff/Faculty: {data.staffFaculty}</p>
                        <p>Community: {data.community}</p>
                      </div>
                    </div>
                  </div>
                );
              }
              return null;
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    );
  });

  // Check if data is ready (not empty and not loading)
  const isDataReady =
    !isLoading &&
    users &&
    users.length >= 0 &&
    participants &&
    participants.length >= 0 &&
    events &&
    events.length >= 0 &&
    !error;

  if (isLoading || !isDataReady) {
    console.log("[Dashboard] Rendering skeleton loading state");
    return (
      <>
        {/* Stats Cards Skeleton */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatsCardSkeleton />
          <StatsCardSkeleton />
          <StatsCardSkeleton />
          <StatsCardSkeleton />
        </div>

        {/* Recent Events Table Skeleton */}
        <div className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>
                <Skeleton className="h-6 w-32" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <TableSkeleton rows={5} columns={7} />
            </CardContent>
          </Card>
        </div>

        {/* Demographic Analysis Skeleton */}
        <div className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>
                <Skeleton className="h-6 w-40" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="age">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="age" disabled>
                    Age Distribution
                  </TabsTrigger>
                  <TabsTrigger value="location" disabled>
                    Luzon Sunburst Chart
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="age" className="space-y-4">
                  <ChartSkeleton />
                  <TableSkeleton rows={6} columns={5} />
                </TabsContent>
                <TabsContent value="location" className="space-y-4">
                  <ChartSkeleton />
                  <TableSkeleton rows={6} columns={5} />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  if (!currentPeriod) {
    console.log("Rendering no academic period message");
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
        <div className="max-w-2xl space-y-4">
          <h2 className="text-2xl font-bold text-gray-900">
            No Active Academic Period
          </h2>
          <p className="text-gray-600">
            Before you can start adding data and viewing analytics, you need to
            set up an academic period. This helps organize your data by school
            year and term.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
            <h3 className="font-semibold text-blue-900 mb-2">
              What you need to do:
            </h3>
            <ol className="list-decimal list-inside space-y-2 text-blue-800">
              <li>Go to the Academic Period Management page</li>
              <li>
                Create a new academic period with the current school year and
                term
              </li>
              <li>Set the start and end dates for the period</li>
              <li>
                Once created, you can start adding events and participants
              </li>
            </ol>
          </div>
          <Button
            onClick={() => {
              console.log(
                "Button clicked - attempting to navigate to Academic Period"
              );
              onNavigate("academic Period");
            }}
            className="mt-6"
          >
            Go to Academic Period Management
          </Button>
        </div>
      </div>
    );
  }

  if (error) {
    console.log("Rendering error state:", error);
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center text-red-600">
          <p>Error loading dashboard: {error}</p>
          <button
            onClick={() => {
              console.log("Retrying dashboard data fetch");
              processData();
            }}
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
              {sexDistribution && sexDistribution.length > 0 ? (
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
                      content={({ active, payload }) => {
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
                <PieChartSkeleton />
              )}
            </div>
            <div className="mt-2 flex flex-col items-center space-y-2">
              {sexDistribution && sexDistribution.length > 0 ? (
                sexDistribution.map((entry, index) => (
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
                ))
              ) : (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-24" />
                </div>
              )}
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
            {eventsWithCreators && eventsWithCreators.length > 0 ? (
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
                    <TableHead className="font-bold text-black">
                      Source
                    </TableHead>
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
                                <span>S: {counts.students} |</span>
                                <span>F: {counts.staffFaculty} |</span>
                                <span>C: {counts.community} </span>
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
                                {formatDistanceToNow(
                                  new Date(event.$createdAt),
                                  {
                                    addSuffix: true,
                                  }
                                )}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>{event.createdByName}</TableCell>
                        </TableRow>
                      );
                    })}
                </TableBody>
              </Table>
            ) : (
              <TableSkeleton rows={5} columns={7} />
            )}
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
                <TabsTrigger value="location">Luzon Sunburst Chart</TabsTrigger>
              </TabsList>
              <TabsContent value="age" className="space-y-4">
                <div className="h-[300px]">
                  {ageDistribution && ageDistribution.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={ageDistribution.filter(
                          (item) => item.name !== "Total"
                        )}
                      >
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
                            position: "inside",
                            formatter: (value) => Math.round(value),
                            style: {
                              fontSize: "16px",
                              fontWeight: "bold",
                              fill: "white",
                              textShadow: "1px 1px 2px rgba(0,0,0,0.5)",
                            },
                            content: (props) => {
                              const { value } = props;
                              return value > 0 ? Math.round(value) : "";
                            },
                          }}
                        >
                          {ageDistribution
                            .filter((item) => item.name !== "Total")
                            .map((item, index) => (
                              <Cell
                                key={item.name}
                                fill={`hsl(${
                                  index * (360 / (ageDistribution.length - 1))
                                }, 70%, 60%)`}
                              />
                            ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <ChartSkeleton />
                  )}
                </div>
                <div className="mt-4">
                  {ageDistribution && ageDistribution.length > 0 ? (
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
                          const isTotal = item.name === "Total";
                          return (
                            <TableRow
                              key={item.name}
                              className={isTotal ? "font-bold bg-muted/50" : ""}
                            >
                              <TableCell>{item.name}</TableCell>
                              <TableCell>{item.value}</TableCell>
                              <TableCell>{item.male}</TableCell>
                              <TableCell>{item.female}</TableCell>
                              <TableCell>
                                {isTotal
                                  ? "100%"
                                  : `${(
                                      (item.value /
                                        ageDistribution[
                                          ageDistribution.length - 1
                                        ].value) *
                                      100
                                    ).toFixed(1)}%`}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  ) : (
                    <TableSkeleton rows={6} columns={5} />
                  )}
                </div>
              </TabsContent>
              <TabsContent value="location" className="space-y-4">
                <div className="h-[300px]">
                  {sunburstData.data && sunburstData.data.length > 0 ? (
                    <SunburstChart
                      data={sunburstData.data}
                      total={sunburstData.total}
                    />
                  ) : (
                    <ChartSkeleton />
                  )}
                </div>
                <div className="mt-4">
                  {sunburstData.data && sunburstData.data.length > 0 ? (
                    <div className="max-h-[300px] overflow-y-auto">
                      <Table>
                        <TableHeader className="sticky top-0 bg-background">
                          <TableRow>
                            <TableHead>Province</TableHead>
                            <TableHead>Municipalities</TableHead>
                            <TableHead>Total</TableHead>
                            <TableHead>Male</TableHead>
                            <TableHead>Female</TableHead>
                            <TableHead>Percentage</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {sunburstData.data.map((province, index) => {
                            const percentage = (
                              (province.value / sunburstData.total) *
                              100
                            ).toFixed(1);
                            const isExpanded = expandedProvinces.has(
                              province.name
                            );
                            return (
                              <React.Fragment key={province.name}>
                                {/* Province row */}
                                <TableRow
                                  className="font-bold bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors"
                                  onClick={() =>
                                    handleProvinceClick(province.name)
                                  }
                                >
                                  <TableCell className="flex items-center gap-2">
                                    <div
                                      className="w-3 h-3 rounded-full"
                                      style={{
                                        backgroundColor:
                                          provinceColors[
                                            index % provinceColors.length
                                          ],
                                      }}
                                    />
                                    {province.children.length > 0 && (
                                      <div className="flex items-center">
                                        {isExpanded ? (
                                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                        ) : (
                                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                        )}
                                      </div>
                                    )}
                                    {province.name}
                                  </TableCell>
                                  <TableCell className="text-muted-foreground">
                                    {province.children.length} municipalities
                                  </TableCell>
                                  <TableCell>{province.value}</TableCell>
                                  <TableCell>{province.male}</TableCell>
                                  <TableCell>{province.female}</TableCell>
                                  <TableCell>{percentage}%</TableCell>
                                </TableRow>
                                {/* Municipality rows - only show if expanded */}
                                {isExpanded &&
                                  province.children.map(
                                    (municipality, muniIndex) => {
                                      const muniPercentage = (
                                        (municipality.value /
                                          sunburstData.total) *
                                        100
                                      ).toFixed(1);
                                      return (
                                        <TableRow
                                          key={`${province.name}-${municipality.name}`}
                                          className="bg-muted/10"
                                        >
                                          <TableCell className="pl-8 text-muted-foreground">
                                            └ {municipality.name}
                                          </TableCell>
                                          <TableCell></TableCell>
                                          <TableCell>
                                            {municipality.value}
                                          </TableCell>
                                          <TableCell>
                                            {municipality.male}
                                          </TableCell>
                                          <TableCell>
                                            {municipality.female}
                                          </TableCell>
                                          <TableCell>
                                            {muniPercentage}%
                                          </TableCell>
                                        </TableRow>
                                      );
                                    }
                                  )}
                              </React.Fragment>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <TableSkeleton rows={6} columns={6} />
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

// Transform location data into hierarchical structure for sunburst chart
const transformLocationDataForSunburst = (participants) => {
  // Create a map to store province and municipality counts
  const provinceData = new Map();
  let grandTotal = 0;

  participants.forEach((participant) => {
    const address = participant.address?.trim() || "Not Specified";
    const sex = participant.sex?.toLowerCase() || "unknown";
    const type = participant.participantType;

    // Use the new Luzon location categorization
    const categorizedLocation = categorizeLuzonLocation(address);

    // Find which province this location belongs to
    let province = "Other Locations";
    for (const [provinceName, municipalities] of Object.entries(
      luzonLocations
    )) {
      if (
        municipalities.some((muni) =>
          address.toLowerCase().includes(muni.toLowerCase())
        )
      ) {
        province = provinceName;
        break;
      }
    }

    // Initialize province if not exists
    if (!provinceData.has(province)) {
      provinceData.set(province, {
        name: province,
        value: 0,
        children: new Map(),
        male: 0,
        female: 0,
        students: 0,
        staffFaculty: 0,
        community: 0,
      });
    }

    const provinceInfo = provinceData.get(province);
    provinceInfo.value++;
    grandTotal++;

    // Count by sex
    if (sex === "male") {
      provinceInfo.male++;
    } else if (sex === "female") {
      provinceInfo.female++;
    }

    // Count by participant type
    if (type === "Student") provinceInfo.students++;
    else if (type === "Staff/Faculty") provinceInfo.staffFaculty++;
    else if (type === "Community Member") provinceInfo.community++;

    // Add municipality data
    const municipality = categorizedLocation;
    if (!provinceInfo.children.has(municipality)) {
      provinceInfo.children.set(municipality, {
        name: municipality,
        value: 0,
        male: 0,
        female: 0,
        students: 0,
        staffFaculty: 0,
        community: 0,
      });
    }

    const municipalityInfo = provinceInfo.children.get(municipality);
    municipalityInfo.value++;

    if (sex === "male") {
      municipalityInfo.male++;
    } else if (sex === "female") {
      municipalityInfo.female++;
    }

    if (type === "Student") municipalityInfo.students++;
    else if (type === "Staff/Faculty") municipalityInfo.staffFaculty++;
    else if (type === "Community Member") municipalityInfo.community++;
  });

  // Convert to hierarchical structure
  const sunburstData = Array.from(provinceData.values()).map((province) => ({
    name: province.name,
    value: province.value,
    male: province.male,
    female: province.female,
    students: province.students,
    staffFaculty: province.staffFaculty,
    community: province.community,
    children: Array.from(province.children.values()).map((municipality) => ({
      name: municipality.name,
      value: municipality.value,
      male: municipality.male,
      female: municipality.female,
      students: municipality.students,
      staffFaculty: municipality.staffFaculty,
      community: municipality.community,
    })),
  }));

  return {
    data: sunburstData,
    total: grandTotal,
  };
};
