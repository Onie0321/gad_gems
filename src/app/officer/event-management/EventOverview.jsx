"use client";

import React, { useEffect, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import {
  Plus,
  Loader2,
  ArrowUpDown,
  RotateCcw,
  PieChart,
  Calendar,
  GraduationCap,
  PartyPopper,
  Users,
  CalendarDays,
  BookOpen,
  Music,
  UsersRound,
  Upload,
} from "lucide-react";
import { format, parseISO, formatDistanceToNow } from "date-fns";
import {
  db,
  COLLECTIONS,
  query,
  collection,
  where,
  orderBy,
  limit,
  getDocs,
  getCurrentUser,
  subscribeToCollection,
  getCurrentAcademicPeriod,
  onSnapshot,
} from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { useTabContext, TabProvider } from "@/context/TabContext";
import { ColorfulSpinner } from "@/components/ui/loader";
import { toast } from "@/hooks/use-toast";

export default function EventOverview({
  currentEventId,
  setCurrentEventId,
  user,
}) {
  const [events, setEvents] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortColumn, setSortColumn] = useState("updatedAt");
  const [sortDirection, setSortDirection] = useState("desc");
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [ageDistribution, setAgeDistribution] = useState([]);
  const [locationDistribution, setLocationDistribution] = useState([]);
  const [currentAcademicPeriod, setCurrentAcademicPeriod] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const router = useRouter();
  const { setActiveTab } = useTabContext();

  const calculateDemographics = (participants) => {
    // Calculate age distribution with better error handling
    const ageGroups = {
      "Below 18": 0,
      "18-24": 0,
      "25-34": 0,
      "35-44": 0,
      "45-54": 0,
      "Above 55": 0,
    };

    // Calculate location distribution with null checks
    const locations = {};

    participants.forEach((participant) => {
      // Age distribution
      const age = parseInt(participant.age);
      if (!isNaN(age)) {
        if (age < 18) ageGroups["Below 18"]++;
        else if (age <= 24) ageGroups["18-24"]++;
        else if (age <= 34) ageGroups["25-34"]++;
        else if (age <= 44) ageGroups["35-44"]++;
        else if (age <= 54) ageGroups["45-54"]++;
        else ageGroups["Above 55"]++;
      }

      // Location distribution using homeAddress
      const location = participant.homeAddress || "Not Specified";
      // Clean up the location string and capitalize first letter of each word
      const formattedLocation = location
        .split(",")[0] // Take only the first part before comma if exists
        .trim()
        .toLowerCase()
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");

      locations[formattedLocation] = (locations[formattedLocation] || 0) + 1;
    });

    // Convert age groups to chart format
    const ageDistribution = Object.entries(ageGroups).map(([age, count]) => ({
      age,
      count,
    }));

    // Convert locations to chart format and sort by count
    const locationDistribution = Object.entries(locations)
      .map(([name, value]) => ({
        name,
        value,
      }))
      .sort((a, b) => b.value - a.value) // Sort by count in descending order
      .slice(0, 10); // Only take top 10 locations to avoid cluttering

    return { ageDistribution, locationDistribution };
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const user = await getCurrentUser();
      setCurrentUser(user);

      // Get current academic period
      const currentPeriod = await getCurrentAcademicPeriod();
      setCurrentAcademicPeriod(currentPeriod);

      if (!currentPeriod) {
        console.warn("No academic period found. Event data may be limited.");
        setEvents([]);
        setParticipants([]);
        setAgeDistribution([]);
        setLocationDistribution([]);
        return; // Exit early but don't throw error
      }

      // First fetch events
      const eventsQuery = query(
        collection(db, COLLECTIONS.EVENTS),
        where("createdBy", "==", user.$id),
        where("isArchived", "==", false),
        where("academicPeriodId", "==", currentPeriod.id),
        orderBy("createdAt", "desc"),
        limit(5)
      );
      const eventsSnapshot = await getDocs(eventsQuery);
      const eventsList = eventsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      if (eventsList.length === 0) {
        setEvents([]);
        setParticipants([]);
        setAgeDistribution([]);
        setLocationDistribution([]);
        return;
      }

      // Get all event IDs
      const eventIds = eventsList.map((event) => event.id);

      // Fetch participants for all events
      const [studentsResponse, staffFacultyResponse, communityResponse] =
        await Promise.all([
          getDocs(query(
            collection(db, COLLECTIONS.STUDENTS),
            where("eventId", "in", eventIds),
            where("isArchived", "==", false),
            where("createdBy", "==", user.$id)
          )),
          getDocs(query(
            collection(db, COLLECTIONS.STAFF_FACULTY),
            where("eventId", "in", eventIds),
            where("isArchived", "==", false),
            where("createdBy", "==", user.$id)
          )),
          getDocs(query(
            collection(db, COLLECTIONS.COMMUNITY),
            where("eventId", "in", eventIds),
            where("isArchived", "==", false),
            where("createdBy", "==", user.$id)
          )),
        ]);

      // Combine all participants
      const allParticipants = [
        ...studentsResponse.docs.map(doc => ({ id: doc.id, ...doc.data() })),
        ...staffFacultyResponse.docs.map(doc => ({ id: doc.id, ...doc.data() })),
        ...communityResponse.docs.map(doc => ({ id: doc.id, ...doc.data() })),
      ];

      // Calculate demographics from all participants
      const { ageDistribution: ageDist, locationDistribution: locDist } =
        calculateDemographics(allParticipants);

      setEvents(eventsList);
      setParticipants(allParticipants);
      setAgeDistribution(ageDist);
      setLocationDistribution(locDist);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Failed to fetch data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fetchNotifications = async (userId) => {
    try {
      // First check if we have a valid collection ID
      if (!COLLECTIONS.NOTIFICATIONS) {
        console.warn("Notifications collection ID is not configured");
        return [];
      }

      const notificationsQuery = query(
        collection(db, COLLECTIONS.NOTIFICATIONS),
        where("userId", "==", userId),
        orderBy("timestamp", "desc"),
        limit(5)
      );
      const querySnapshot = await getDocs(notificationsQuery);
      return querySnapshot.docs.map(doc => ({ id: doc.id, $id: doc.id, ...doc.data() }));
    } catch (error) {
      // If collection doesn't exist, log warning and return empty array
      if (error.code === 404) {
        console.warn(
          "Notifications collection not found - this feature might not be set up yet"
        );
        return [];
      }
      console.error("Error fetching notifications:", error);
      return [];
    }
  };

  useEffect(() => {
    const fetchUserAndData = async () => {
      try {
        const user = await getCurrentUser();
        if (user) {
          setCurrentUser(user);
          await fetchData();

          // Set up real-time listeners
          const unsubscribeEvents = subscribeToCollection(
            COLLECTIONS.EVENTS,
            async (response) => {
              console.log("Event update received:", response);
              await fetchData();
            }
          );

          const unsubscribeParticipants = subscribeToCollection(
            COLLECTIONS.STUDENTS,
            async (response) => {
              console.log("Participant update received:", response);
              await fetchData();
            }
          );

          return () => {
            unsubscribeEvents();
            unsubscribeParticipants();
          };
        }
      } catch (error) {
        console.error("Error fetching current user:", error);
        setError("Failed to authenticate user.");
      }
    };

    fetchUserAndData();
  }, []);

  useEffect(() => {
    const loadNotifications = async () => {
      if (user?.$id) {
        try {
          const notifications = await fetchNotifications(user.$id);
          setNotifications(notifications);
        } catch (error) {
          console.warn("Failed to load notifications:", error);
          // Continue with the app even if notifications fail
        }
      }
    };

    loadNotifications();
  }, [user]);

  useEffect(() => {
    if (!user) return;

    // Subscribe to real-time updates using Firebase onSnapshot
    const eventsQuery = query(
      collection(db, COLLECTIONS.EVENTS),
      where("createdBy", "==", user.$id),
      orderBy("updatedAt", "desc"),
      limit(5)
    );

    const unsubscribe = onSnapshot(eventsQuery, (snapshot) => {
      const eventsList = snapshot.docs.map(doc => ({
        id: doc.id,
        $id: doc.id,
        ...doc.data()
      }));
      setEvents(eventsList);
    });

    return () => {
      unsubscribe();
    };
  }, [user]);

  const getParticipantCounts = (eventId) => {
    const eventParticipants = participants.filter((p) => p.eventId === eventId);

    // Count by participant type - handle both created and imported events
    const studentCount = eventParticipants.filter(
      (p) =>
        p.participantType === "student" ||
        p.participantType === "Student" ||
        p.type === "student" ||
        p.category === "student" ||
        p.participantType === "student"
    ).length;

    const staffFacultyCount = eventParticipants.filter(
      (p) =>
        p.participantType === "staff" ||
        p.participantType === "Staff" ||
        p.type === "staff/faculty" ||
        p.category === "staff" ||
        p.category === "faculty"
    ).length;

    const communityCount = eventParticipants.filter(
      (p) =>
        p.participantType === "community" ||
        p.participantType === "Community" ||
        p.type === "community member" ||
        p.category === "community"
    ).length;

    // Count by gender across all types
    const maleCount = eventParticipants.filter((p) => p.sex === "Male").length;
    const femaleCount = eventParticipants.filter(
      (p) => p.sex === "Female"
    ).length;
    const totalCount = eventParticipants.length;

    // Add debug logging
    "Event Participants:",
      {
        eventId,
        participants: eventParticipants,
        studentCount,
        staffFacultyCount,
        communityCount,
        maleCount,
        femaleCount,
        totalCount,
      };

    return {
      total: totalCount,
      male: maleCount,
      female: femaleCount,
      students: studentCount,
      staffFaculty: staffFacultyCount,
      community: communityCount,
    };
  };

  const summaryStats = useMemo(() => {
    // Calculate totals from all events and their participants
    let totalParticipants = 0;
    let maleParticipants = 0;
    let femaleParticipants = 0;
    let studentParticipants = 0;
    let staffParticipants = 0;
    let communityParticipants = 0;

    events.forEach((event) => {
      // Get all types of participants for this event
      const eventStudents = participants.filter(
        (p) => p.eventId === event.id && p.participantType === "student"
      );
      const eventStaff = participants.filter(
        (p) => p.eventId === event.id && p.participantType === "staff"
      );
      const eventCommunity = participants.filter(
        (p) => p.eventId === event.id && p.participantType === "community"
      );

      // Combine all participants for this event
      const allEventParticipants = [
        ...eventStudents,
        ...eventStaff,
        ...eventCommunity,
      ];

      // Update totals
      totalParticipants += allEventParticipants.length;
      maleParticipants += allEventParticipants.filter(
        (p) => p.sex === "Male"
      ).length;
      femaleParticipants += allEventParticipants.filter(
        (p) => p.sex === "Female"
      ).length;

      // Update type counts
      studentParticipants += eventStudents.length;
      staffParticipants += eventStaff.length;
      communityParticipants += eventCommunity.length;
    });

    return {
      total: events.length,
      academic: events.filter((e) => e.eventType === "Academic").length,
      nonAcademic: events.filter((e) => e.eventType === "Non-Academic").length,
      totalParticipants,
      maleParticipants,
      femaleParticipants,
      studentParticipants,
      staffParticipants,
      communityParticipants,
    };
  }, [events, participants]);

  const filteredEvents = events.filter((event) => {
    const searchableFields = [
      event.eventName,
      event.eventVenue,
      event.eventType,
      format(parseISO(event.eventDate), "MMMM d, yyyy"),
    ].map((field) => (field ? field.toLowerCase() : ""));

    return searchableFields.some((field) =>
      field.includes(searchTerm.toLowerCase())
    );
  });

  const sortedEvents = useMemo(() => {
    return [...filteredEvents].sort((a, b) => {
      if (sortColumn === "updatedAt") {
        // Sort by Firebase's updatedAt field
        const aDate = a.updatedAt?.toDate?.() || a.updatedAt || new Date(0);
        const bDate = b.updatedAt?.toDate?.() || b.updatedAt || new Date(0);
        return sortDirection === "asc"
          ? new Date(aDate) - new Date(bDate)
          : new Date(bDate) - new Date(aDate);
      } else if (sortColumn === "eventDate") {
        return sortDirection === "asc"
          ? new Date(a.eventDate) - new Date(b.eventDate)
          : new Date(b.eventDate) - new Date(a.eventDate);
      } else if (sortColumn === "eventName") {
        return sortDirection === "asc"
          ? a.eventName.localeCompare(b.eventName)
          : b.eventName.localeCompare(a.eventName);
      } else if (sortColumn === "totalParticipants") {
              const aCount = getParticipantCounts(a.id).total;
      const bCount = getParticipantCounts(b.id).total;
        return sortDirection === "asc" ? aCount - bCount : bCount - aCount;
      }
      // Default to sorting by updatedAt
      const aDate = a.updatedAt?.toDate?.() || a.updatedAt || new Date(0);
      const bDate = b.updatedAt?.toDate?.() || b.updatedAt || new Date(0);
      return sortDirection === "asc"
        ? new Date(aDate) - new Date(bDate)
        : new Date(bDate) - new Date(aDate);
    });
  }, [filteredEvents, sortColumn, sortDirection, participants]);

  const handleSort = (column) => {
    if (column === sortColumn) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const resetSort = () => {
    setSortColumn("updatedAt");
    setSortDirection("desc");
  };

  const handleNavigateToCreateEvent = () => {
    setActiveTab("createEvent");
  };

  useEffect(() => {
    const fetchAcademicPeriod = async () => {
      try {
        const academicPeriodsQuery = query(
          collection(db, COLLECTIONS.ACADEMIC_PERIODS),
          where("isActive", "==", true),
          orderBy("createdAt", "desc"),
          limit(1)
        );
        const querySnapshot = await getDocs(academicPeriodsQuery);

        if (!querySnapshot.empty) {
          const periodData = querySnapshot.docs[0];
          setCurrentAcademicPeriod({ id: periodData.id, ...periodData.data() });
        }
      } catch (error) {
        setError("Failed to fetch academic period");
      }
    };

    fetchAcademicPeriod();
  }, []);

  const handleEventCreated = async (event) => {
    try {
      await fetchData();
      toast.success("Event created successfully!");
    } catch (error) {
      toast.error("Error updating event list");
    }
  };

  const handleError = (error) => {
    toast.error(error.message || "Operation failed");
  };

  if (loading) {
    return <ColorfulSpinner size="md" className="mr-2" />;
  }

  if (error) {
    return (
      <div className="text-center text-red-500">
        <p>{error}</p>
        <Button onClick={() => fetchData(currentUser?.$id)} className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  if (!currentAcademicPeriod) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Event Overview</CardTitle>
          <CardDescription>View and analyze your events</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="mb-4">
              <PieChart className="mx-auto h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2">
              No Active Academic Period
            </h3>
            <p className="text-muted-foreground">
              Event overview will be available once an administrator sets up the
              current academic period.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // If there are no events, show empty state
  if (events.length === 0) {
    return renderEmptyState();
  }

  if (filteredEvents.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between">
          <h2 className="text-2xl font-bold">Recent Events</h2>
          <Button onClick={handleNavigateToCreateEvent}>
            <Plus className="mr-2 h-4 w-4" /> Add Event
          </Button>
        </div>
        {/* ... rest of the no search results UI ... */}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Event Overview</CardTitle>
          <CardDescription>View and manage your events</CardDescription>
          {currentAcademicPeriod ? (
            <div className="mt-2 text-sm text-muted-foreground">
              <div>
                Academic Period: {currentAcademicPeriod.schoolYear} -{" "}
                {currentAcademicPeriod.periodType}
              </div>
              <div>
                {format(
                  new Date(currentAcademicPeriod.startDate),
                  "MMM d, yyyy"
                )}{" "}
                -{" "}
                {format(new Date(currentAcademicPeriod.endDate), "MMM d, yyyy")}
              </div>
            </div>
          ) : (
            <div className="mt-2 text-sm text-muted-foreground">
              No active academic period found
            </div>
          )}
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardHeader className="pb-2">
            <div className="flex items-center space-x-2">
              <CalendarDays className="h-5 w-5 opacity-80" />
              <CardTitle className="text-lg font-medium opacity-80">
                Total Events
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <div className="text-3xl font-bold">{summaryStats.total}</div>
              <div className="p-2 bg-blue-400 rounded-full">
                <CalendarDays className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
          <CardHeader className="pb-2">
            <div className="flex items-center space-x-2">
              <BookOpen className="h-5 w-5 opacity-80" />
              <CardTitle className="text-lg font-medium opacity-80">
                Academic Events
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <div className="text-3xl font-bold">{summaryStats.academic}</div>
              <div className="p-2 bg-green-400 rounded-full">
                <BookOpen className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <CardHeader className="pb-2">
            <div className="flex items-center space-x-2">
              <Music className="h-5 w-5 opacity-80" />
              <CardTitle className="text-lg font-medium opacity-80">
                Non-Academic Events
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <div className="text-3xl font-bold">
                {summaryStats.nonAcademic}
              </div>
              <div className="p-2 bg-purple-400 rounded-full">
                <Music className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
          <CardHeader className="pb-2">
            <div className="flex items-center space-x-2">
              <UsersRound className="h-5 w-5 opacity-80" />
              <CardTitle className="text-lg font-medium opacity-80">
                Total Participants
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col">
              <div className="flex justify-between items-center">
                <div className="text-3xl font-bold">
                  {summaryStats.totalParticipants}
                </div>
                <div className="p-2 bg-orange-400 rounded-full">
                  <UsersRound className="h-6 w-6" />
                </div>
              </div>
              <div className="text-xs mt-2 opacity-80">
                Male: {summaryStats.maleParticipants} | Female:{" "}
                {summaryStats.femaleParticipants}
              </div>
              <div className="text-xs mt-1 opacity-80">
                Students: {summaryStats.studentParticipants} | Staff:{" "}
                {summaryStats.staffParticipants} | Community:{" "}
                {summaryStats.communityParticipants}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Table>
        <TableCaption>A list of your recent events.</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>
              <Button variant="ghost" onClick={() => handleSort("eventName")}>
                Event Name
                <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            </TableHead>
            <TableHead>
              <Button variant="ghost" onClick={() => handleSort("eventDate")}>
                Date
                <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            </TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Source</TableHead>
            <TableHead>
              <Button variant="ghost" onClick={() => handleSort("createdAt")}>
                Created At
                <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            </TableHead>
            <TableHead className="text-right">
              <Button
                variant="ghost"
                onClick={() => handleSort("totalParticipants")}
              >
                Participants
                <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedEvents.map((event) => {
            const {
              total: totalCount,
              male: maleCount,
              female: femaleCount,
              students: studentCount,
              staffFaculty: staffFacultyCount,
              community: communityCount,
            } = getParticipantCounts(event.id);

            return (
                              <TableRow key={event.id}>
                <TableCell className="font-medium">{event.eventName}</TableCell>
                <TableCell>
                  {format(parseISO(event.eventDate), "MMMM d, yyyy")}
                </TableCell>
                <TableCell>{event.eventVenue}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {event.source === "imported" ? (
                      <Upload className="h-4 w-4 text-blue-500" />
                    ) : (
                      <Plus className="h-4 w-4 text-green-500" />
                    )}
                    <span className="capitalize">
                      {event.source || "created"}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="text-sm">
                      {format(new Date(event.createdAt?.toDate?.() || event.createdAt), "MMM d, yyyy h:mm a")}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(event.createdAt?.toDate?.() || event.createdAt), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex flex-col items-center">
                    <div className="font-medium">Total: {totalCount}</div>
                    <div className="text-sm">
                      <span className="text-blue-600 font-medium">
                        {maleCount}
                      </span>
                      <span className="mx-1">/</span>
                      <span className="text-pink-600 font-medium">
                        {femaleCount}
                      </span>
                    </div>
                    <div className="text-xs space-x-1 text-muted-foreground">
                      <span
                        title="Students"
                        className="inline-flex items-center"
                      >
                        <GraduationCap className="h-3 w-3 mr-0.5" />
                        {studentCount}
                      </span>
                      <span>|</span>
                      <span
                        title="Staff/Faculty"
                        className="inline-flex items-center"
                      >
                        <Users className="h-3 w-3 mr-0.5" />
                        {staffFacultyCount}
                      </span>
                      <span>|</span>
                      <span
                        title="Community"
                        className="inline-flex items-center"
                      >
                        <UsersRound className="h-3 w-3 mr-0.5" />
                        {communityCount}
                      </span>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
