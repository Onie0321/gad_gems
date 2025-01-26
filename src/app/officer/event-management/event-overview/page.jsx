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
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Plus, Loader2, ArrowUpDown, RotateCcw, PieChart } from "lucide-react";
import { format, parseISO } from "date-fns";
import {
  databases,
  databaseId,
  eventCollectionId,
  participantCollectionId,
  getCurrentUser,
  subscribeToRealTimeUpdates,
  getCurrentAcademicPeriod,
} from "@/lib/appwrite";
import { client } from "@/lib/appwrite";
import { useRouter } from "next/navigation";
import { useTabContext, TabProvider } from "@/context/TabContext";
import { Query } from "appwrite";
import { LoadingAnimation } from "@/components/loading/loading-animation";

export default function EventOverview({
  currentEventId,
  setCurrentEventId,
  user,
  currentAcademicPeriod,
}) {
  const [events, setEvents] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortColumn, setSortColumn] = useState("eventDate");
  const [sortDirection, setSortDirection] = useState("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [eventsPerPage, setEventsPerPage] = useState(5);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [ageDistribution, setAgeDistribution] = useState([]);
  const [locationDistribution, setLocationDistribution] = useState([]);
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

  const fetchData = async (userId) => {
    try {
      setLoading(true);
      // Get current academic period
      const currentPeriod = await getCurrentAcademicPeriod();
      if (!currentPeriod) {
        throw new Error("No active academic period found");
        return;
      }

      // First fetch events
      const eventsResponse = await databases.listDocuments(
        databaseId,
        eventCollectionId,
        [
          Query.equal("createdBy", userId),
          Query.equal("isArchived", false),
          Query.equal("academicPeriodId", currentPeriod.$id),
          Query.orderDesc("$createdAt"),
        ]
      );

      if (eventsResponse.documents.length === 0) {
        setEvents([]);
        setParticipants([]);
        setAgeDistribution([]);
        setLocationDistribution([]);
        return;
      }

      // Get all event IDs
      const eventIds = eventsResponse.documents.map((event) => event.$id);

      // Fetch participants for all events
      const participantsPromises = eventIds.map((eventId) =>
        databases.listDocuments(databaseId, participantCollectionId, [
          Query.equal("eventId", eventId),
          Query.equal("isArchived", false),
        ])
      );

      const participantsResponses = await Promise.all(participantsPromises);

      // Combine all participants and map them to their events
      const allParticipants = participantsResponses.flatMap(
        (response) => response.documents
      );

      // Map participants to their respective events
      const eventsWithParticipants = eventsResponse.documents.map((event) => ({
        ...event,
        participants: allParticipants.filter((p) => p.eventId === event.$id),
      }));

      // Calculate demographics from all participants
      const { ageDistribution: ageDist, locationDistribution: locDist } =
        calculateDemographics(allParticipants);

      console.log("Events with participants:", eventsWithParticipants);
      console.log("All participants:", allParticipants);
      console.log("Age Distribution:", ageDist);
      console.log("Location Distribution:", locDist);

      setEvents(eventsWithParticipants);
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

  useEffect(() => {
    const fetchUserAndData = async () => {
      try {
        const user = await getCurrentUser();
        if (user) {
          setCurrentUser(user);
          await fetchData(user.$id);

          // Set up real-time listeners
          const unsubscribeEvents = subscribeToRealTimeUpdates(
            eventCollectionId,
            async (response) => {
              console.log("Event update received:", response);
              await fetchData(user.$id);
            }
          );

          const unsubscribeParticipants = subscribeToRealTimeUpdates(
            participantCollectionId,
            async (response) => {
              console.log("Participant update received:", response);
              await fetchData(user.$id);
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

  // Add debug logging for state changes
  useEffect(() => {
    console.log("Events state updated:", events);
  }, [events]);

  useEffect(() => {
    console.log("Participants state updated:", participants);
  }, [participants]);

  useEffect(() => {
    const unsubscribe = client.subscribe(
      `databases.${process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID}.collections.${process.env.NEXT_PUBLIC_APPWRITE_EVENT_COLLECTION_ID}.documents`,
      (response) => {
        if (
          response.events.includes(
            "databases.*.collections.*.documents.*.update"
          ) ||
          response.events.includes(
            "databases.*.collections.*.documents.*.create"
          )
        ) {
          // Update the specific event in the local state
          const updatedEvent = response.payload;
          setEvents((prevEvents) =>
            prevEvents.map((event) =>
              event.$id === updatedEvent.$id
                ? { ...event, ...updatedEvent }
                : event
            )
          );
        }
      }
    );

    return () => {
      unsubscribe();
    };
  }, []);

  const getParticipantCounts = (eventId) => {
    const eventParticipants = participants.filter((p) => p.eventId === eventId);
    console.log(
      `Counting participants for event ${eventId}:`,
      eventParticipants
    );

    return {
      total: eventParticipants.length,
      male: eventParticipants.filter((p) => p.sex === "Male").length,
      female: eventParticipants.filter((p) => p.sex === "Female").length,
    };
  };

  const summaryStats = useMemo(() => {
    // Calculate totals from all events and their participants
    let totalParticipants = 0;
    let maleParticipants = 0;
    let femaleParticipants = 0;

    events.forEach((event) => {
      const participants = event.participants || [];
      totalParticipants += participants.length;
      maleParticipants += participants.filter((p) => p.sex === "Male").length;
      femaleParticipants += participants.filter(
        (p) => p.sex === "Female"
      ).length;
    });

    return {
      total: events.length,
      academic: events.filter((e) => e.eventType === "Academic").length,
      nonAcademic: events.filter((e) => e.eventType === "Non-Academic").length,
      totalParticipants,
      maleParticipants,
      femaleParticipants,
    };
  }, [events]);

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
      if (sortColumn === "default" || sortColumn === "eventDate") {
        return sortDirection === "asc"
          ? new Date(a.eventDate) - new Date(b.eventDate)
          : new Date(b.eventDate) - new Date(a.eventDate);
      } else if (sortColumn === "eventName") {
        return sortDirection === "asc"
          ? a.eventName.localeCompare(b.eventName)
          : b.eventName.localeCompare(a.eventName);
      } else if (sortColumn === "totalParticipants") {
        const aCount = getParticipantCounts(a.$id).total;
        const bCount = getParticipantCounts(b.$id).total;
        return sortDirection === "asc" ? aCount - bCount : bCount - aCount;
      }
      return 0;
    });
  }, [filteredEvents, sortColumn, sortDirection, participants]);

  const indexOfLastEvent = currentPage * eventsPerPage;
  const indexOfFirstEvent = indexOfLastEvent - eventsPerPage;
  const currentEvents = sortedEvents.slice(indexOfFirstEvent, indexOfLastEvent);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const handleSort = (column) => {
    if (column === sortColumn) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const resetSort = () => {
    setSortColumn("default");
    setSortDirection("desc");
  };

  const handleNavigateToCreateEvent = () => {
    setActiveTab("createEvent");
  };

  const renderEmptyState = () => {
    return (
      <Card className="w-full">
        <CardHeader className="text-center">
          <CardTitle>No Events Available</CardTitle>
          <CardDescription>
            There are no events in the current academic period
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          <Button onClick={() => setActiveTab("createEvent")}>
            <Plus className="mr-2 h-4 w-4" /> Create Your First Event
          </Button>
          <div className="flex items-center gap-2">
            <div className="h-px w-16 bg-gray-300" />
            <span className="text-sm text-gray-500">or</span>
            <div className="h-px w-16 bg-gray-300" />
          </div>
          <ImportEventData />
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return <LoadingAnimation message="Loading events..." />;
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
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Event Overview</CardTitle>
          <CardDescription>View and manage your events</CardDescription>
          {currentAcademicPeriod && (
            <div className="mt-2 text-sm text-muted-foreground">
              Academic Period: {currentAcademicPeriod.schoolYear} -{" "}
              {currentAcademicPeriod.periodType}
              <br />
              {format(
                new Date(currentAcademicPeriod.startDate),
                "MMM d, yyyy"
              )}{" "}
              - {format(new Date(currentAcademicPeriod.endDate), "MMM d, yyyy")}
            </div>
          )}
        </CardHeader>
        <CardContent>
          {events.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p className="text-lg">
                No events found in the current academic period
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div>
                <h3 className="text-lg font-semibold">Total Events</h3>
                <p className="text-3xl font-bold">{summaryStats.total}</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold">Academic Events</h3>
                <p className="text-3xl font-bold">{summaryStats.academic}</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold">Non-Academic Events</h3>
                <p className="text-3xl font-bold">{summaryStats.nonAcademic}</p>
              </div>
            </div>
          )}
          <div className="mt-4 text-center">
            <h3 className="text-lg font-semibold">Total Participants</h3>
            <p className="text-3xl font-bold">
              {summaryStats.totalParticipants}
            </p>
            <p className="text-sm text-muted-foreground">
              (Male: {summaryStats.maleParticipants} | Female:{" "}
              {summaryStats.femaleParticipants})
            </p>
          </div>
        </CardContent>
      </Card>
      <div className="flex justify-between items-center">
        <Button variant="outline" onClick={resetSort}>
          <RotateCcw className="mr-2 h-4 w-4" />
          Reset Sort
        </Button>
        <Select
          value={`${eventsPerPage}`}
          onValueChange={(value) => setEventsPerPage(Number(value))}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Events per page" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="5">5 per page</SelectItem>
            <SelectItem value="10">10 per page</SelectItem>
            <SelectItem value="15">15 per page</SelectItem>
          </SelectContent>
        </Select>
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
          {currentEvents.map((event) => {
            const eventParticipants = event.participants || [];
            const maleCount = eventParticipants.filter(
              (p) => p.sex === "Male"
            ).length;
            const femaleCount = eventParticipants.filter(
              (p) => p.sex === "Female"
            ).length;
            const totalCount = eventParticipants.length;

            return (
              <TableRow key={event.$id}>
                <TableCell className="font-medium">{event.eventName}</TableCell>
                <TableCell>
                  {format(parseISO(event.eventDate), "MMMM d, yyyy")}
                </TableCell>
                <TableCell>{event.eventVenue}</TableCell>
                <TableCell className="text-center">
                  <div className="flex flex-col items-center">
                    <div>Total: {totalCount}</div>
                    <div className="text-sm text-muted-foreground">
                      <span className="text-blue-600">{maleCount}</span>/
                      <span className="text-pink-600">{femaleCount}</span>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              onClick={() => paginate(currentPage - 1)}
              disabled={currentPage === 1}
            />
          </PaginationItem>
          {Array.from({
            length: Math.ceil(sortedEvents.length / eventsPerPage),
          }).map((_, index) => (
            <PaginationItem key={index}>
              <PaginationLink
                onClick={() => paginate(index + 1)}
                isActive={currentPage === index + 1}
              >
                {index + 1}
              </PaginationLink>
            </PaginationItem>
          ))}
          <PaginationItem>
            <PaginationNext
              onClick={() => paginate(currentPage + 1)}
              disabled={
                currentPage === Math.ceil(sortedEvents.length / eventsPerPage)
              }
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}
