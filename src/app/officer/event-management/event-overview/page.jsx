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
import { Plus, Loader2, ArrowUpDown, RotateCcw } from "lucide-react";
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

export default function EventOverView() {
  const [events, setEvents] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortColumn, setSortColumn] = useState("eventDate");
  const [sortDirection, setSortDirection] = useState("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [eventsPerPage, setEventsPerPage] = useState(5);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { setActiveTab } = useTabContext();

  const fetchData = async (userId) => {
    try {
      setLoading(true);
      // Get current academic period
      const currentPeriod = await getCurrentAcademicPeriod();
      if (!currentPeriod) {
        throw new Error("No active academic period found");
        return;
      }

      const fetchedEvents = await databases.listDocuments(
        databaseId,
        eventCollectionId,
        [
          Query.equal("createdBy", userId),
          Query.equal("isArchived", false),
          Query.equal("academicPeriodId", currentPeriod.$id),
          Query.orderDesc("$createdAt"),
        ]
      );

      if (fetchedEvents.documents.length > 0) {
        setEvents(fetchedEvents.documents);

        // Fetch all participants for all events
        const participantsResponse = await databases.listDocuments(
          databaseId,
          participantCollectionId,
          [
            Query.equal("isArchived", false),
            Query.equal("academicPeriodId", currentPeriod.$id),
            Query.equal(
              "eventId",
              fetchedEvents.documents.map((event) => event.$id)
            ),
          ]
        );

        setParticipants(participantsResponse.documents);
      } else {
        setEvents([]);
        setParticipants([]);
      }
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
        console.log("Current user:", user);
        setCurrentUser(user);

        if (user) {
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

  const summaryStats = useMemo(() => {
    const totalParticipants = participants.length;
    const maleParticipants = participants.filter(
      (p) => p.sex === "Male"
    ).length;
    const femaleParticipants = participants.filter(
      (p) => p.sex === "Female"
    ).length;

    return {
      total: events.length,
      academic: events.filter((e) => e.eventType === "Academic").length,
      nonAcademic: events.filter((e) => e.eventType === "Non-Academic").length,
      totalParticipants,
      maleParticipants,
      femaleParticipants,
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

  const getParticipantCounts = (eventId) => {
    // Filter participants for this specific event
    const eventParticipants = participants.filter((p) => p.eventId === eventId);

    return {
      total: eventParticipants.length,
      male: eventParticipants.filter((p) => p.sex === "Male").length,
      female: eventParticipants.filter((p) => p.sex === "Female").length,
    };
  };

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

  if (loading) {
    return <LoadingAnimation message="Loading events..." />;
  }

  if (error) {
    return (
      <div className="text-center text-red-500">
        <p>{error}</p>
        <Button onClick={() => fetchData()} className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  // If there are no events, show empty state
  if (events.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader className="text-center">
          <CardTitle>No Events Available</CardTitle>
          <CardDescription>
            There are no events in the current academic period
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Button onClick={() => setActiveTab("createEvent")}>
            <Plus className="mr-2 h-4 w-4" /> Create Your First Event
          </Button>
        </CardContent>
      </Card>
    );
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
        </CardHeader>
        <CardContent>
          {events.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p className="text-lg">
                There are no events in the current academic period
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
            const participantCounts = getParticipantCounts(event.$id);

            return (
              <TableRow key={event.$id}>
                <TableCell className="font-medium">{event.eventName}</TableCell>
                <TableCell>
                  {format(parseISO(event.eventDate), "MMMM d, yyyy")}
                </TableCell>
                <TableCell>{event.eventVenue}</TableCell>
                <TableCell className="text-right">
                  <div>(Total: {participantCounts.total})</div>
                  <div className="text-sm text-muted-foreground">
                    (M: {participantCounts.male} | F: {participantCounts.female}
                    )
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
