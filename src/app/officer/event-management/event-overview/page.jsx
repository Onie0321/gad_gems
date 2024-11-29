import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Plus, Loader2 } from "lucide-react";
import { format, parseISO } from "date-fns";
import {
  getEvents,
  databases,
  eventCollectionId,
  participantCollectionId,
  getParticipants,
  subscribeToRealTimeUpdates,
} from "@/lib/appwrite";

export default function EventOverView({ setActiveSection }) {
  const [events, setEvents] = useState([]);
  const [participants, setParticipants] = useState([]); // Define participants with useState
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortColumn, setSortColumn] = useState("date");
  const [sortDirection, setSortDirection] = useState("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [eventsPerPage, setEventsPerPage] = useState(5);

  useEffect(() => {
    fetchData();

    const unsubscribeEvents = subscribeToRealTimeUpdates(
      eventCollectionId,
      fetchData
    );
    const unsubscribeParticipants = subscribeToRealTimeUpdates(
      participantCollectionId,
      fetchData
    );

    return () => {
      unsubscribeEvents();
      unsubscribeParticipants();
    };
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const fetchedEvents = await getEvents();
      setEvents(fetchedEvents || []);

      if (fetchedEvents.length > 0) {
        const allParticipants = await Promise.all(
          fetchedEvents.map((event) => getParticipants(event.$id))
        );
        setParticipants(allParticipants.flat() || []);
      } else {
        setParticipants([]);
      }
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Failed to fetch data.");
    } finally {
      setLoading(false);
    }
  };
  

  const summaryStats = React.useMemo(
    () => ({
      total: events.length,
      academic: events.filter((e) => e.eventType === "Academic").length, // Use eventType attribute
      nonAcademic: events.filter((e) => e.eventType === "Non-Academic").length, // Use eventType attribute
    }),
    [events]
  );

  const filteredEvents = events.filter((event) => {
    const eventName = event.name ? event.name.toLowerCase() : ""; // Use empty string if undefined
    const eventVenue = event.venue ? event.venue.toLowerCase() : ""; // Use empty string if undefined

    return (
      eventName.includes(searchTerm.toLowerCase()) ||
      eventVenue.includes(searchTerm.toLowerCase())
    );
  });

  const sortedEvents = [...filteredEvents].sort((a, b) => {
    if (a[sortColumn] < b[sortColumn]) return sortDirection === "asc" ? -1 : 1;
    if (a[sortColumn] > b[sortColumn]) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });

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

  const getParticipantCounts = (eventId) => {
    const eventParticipants = participants.filter((p) => p.eventId === eventId);
    const maleCount = eventParticipants.filter((p) => p.sex === "Male").length;
    const femaleCount = eventParticipants.filter(
      (p) => p.sex === "Female"
    ).length;
    return {
      total: eventParticipants.length,
      male: maleCount,
      female: femaleCount,
    };
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-500">
        <p>{error}</p>
        <Button onClick={fetchEvents} className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <h2 className="text-2xl font-bold">Recent Events</h2>
        <Button onClick={() => setActiveSection("create")}>
          <Plus className="mr-2 h-4 w-4" /> Add Event
        </Button>
      </div>
      <div className="flex justify-between items-center">
        <Input
          placeholder="Search events..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
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
            <SelectItem value="20">20 per page</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-3 gap-4 text-center">
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
        </CardContent>
      </Card>
      <Table>
        <TableCaption>A list of your recent events.</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Event Name</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Location</TableHead>
            <TableHead className="text-right">Participants</TableHead>
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
