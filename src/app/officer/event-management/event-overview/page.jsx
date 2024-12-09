import React, { useEffect, useState, useMemo } from "react";
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
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Plus, Loader2, ArrowUpDown, RotateCcw } from 'lucide-react';
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
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortColumn, setSortColumn] = useState("eventDate");
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

  const summaryStats = useMemo(() => {
    const totalParticipants = participants.length;
    const maleParticipants = participants.filter(p => p.sex === "Male").length;
    const femaleParticipants = participants.filter(p => p.sex === "Female").length;

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
      format(parseISO(event.eventDate), "MMMM d, yyyy")
    ].map(field => field ? field.toLowerCase() : '');

    return searchableFields.some(field => field.includes(searchTerm.toLowerCase()));
  });

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
        <Button onClick={fetchData} className="mt-4">
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
      <div className="relative w-full max-w-sm">
        <Input
          placeholder="Search events..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1); // Reset to first page when searching
          }}
          className="w-full"
        />
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
          <div className="mt-4 text-center">
            <h3 className="text-lg font-semibold">Total Participants</h3>
            <p className="text-3xl font-bold">{summaryStats.totalParticipants}</p>
            <p className="text-sm text-muted-foreground">
              (Male: {summaryStats.maleParticipants} | Female: {summaryStats.femaleParticipants})
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
              <Button variant="ghost" onClick={() => handleSort("totalParticipants")}>
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
                    (M: {participantCounts.male} | F: {participantCounts.female})
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