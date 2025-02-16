"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { LoadingAnimation } from "@/components/loading/loading-animation";
import { format } from "date-fns";
import { toast } from "react-toastify";
import {
  databases,
  databaseId,
  eventCollectionId,
  studentsCollectionId,
  userCollectionId,
  getCurrentAcademicPeriod,
  staffFacultyCollectionId,
  communityCollectionId,
  academicPeriodCollectionId,
} from "@/lib/appwrite";
import { Query } from "appwrite";
import { Eye, Edit, ArrowUpDown } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ID } from "appwrite";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

import EditEvent from "@/app/officer/event-management/event-participant-log/EditEventDialog";
import ViewParticipants from "@/app/officer/event-management/event-participant-log/view-participant-dialog/page";
import ExportEventsButton from "@/app/officer/event-management/event-participant-log/ExportEvent";
import GenerateReportButton from "@/app/officer/event-management/event-participant-log/ImportEvent";

export default function EventParticipantLog() {
  const [events, setEvents] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortCriteria, setSortCriteria] = useState("createdAtDesc");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showParticipants, setShowParticipants] = useState(false);
  const [showEventDetails, setShowEventDetails] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch all events without academic period filter for admin
      const response = await databases.listDocuments(
        databaseId,
        eventCollectionId,
        [Query.equal("isArchived", false), Query.orderDesc("createdAt")]
      );

      // Get all unique academic period IDs from events
      const academicPeriodIds = [
        ...new Set(response.documents.map((event) => event.academicPeriodId)),
      ];

      // Fetch all participants across all periods
      const [studentsResponse, staffResponse, communityResponse] =
        await Promise.all([
          databases.listDocuments(databaseId, studentsCollectionId, [
            Query.equal("isArchived", false),
            Query.equal("academicPeriodId", academicPeriodIds),
          ]),
          databases.listDocuments(databaseId, staffFacultyCollectionId, [
            Query.equal("isArchived", false),
            Query.equal("academicPeriodId", academicPeriodIds),
          ]),
          databases.listDocuments(databaseId, communityCollectionId, [
            Query.equal("isArchived", false),
            Query.equal("academicPeriodId", academicPeriodIds),
          ]),
        ]);

      // Map participants with their specific fields
      const allParticipants = [
        ...studentsResponse.documents.map((p) => ({
          ...p,
          participantType: "Student",
          identifier: p.studentId || null,
        })),
        ...staffResponse.documents.map((p) => ({
          ...p,
          participantType: "Staff/Faculty",
          identifier: p.staffFacultyId || null,
        })),
        ...communityResponse.documents.map((p) => ({
          ...p,
          participantType: "Community Member",
          identifier: null,
        })),
      ];

      // Process events with participants
      const eventsWithParticipants = await Promise.all(
        response.documents.map(async (event) => {
          try {
            const eventParticipants = allParticipants.filter(
              (p) => p.eventId === event.$id
            );

            // Calculate participant counts with proper type checking
            const participantCounts = {
              total: eventParticipants.length,
              male: eventParticipants.filter(
                (p) => p.sex?.toLowerCase() === "male"
              ).length,
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

            // Fetch creator information
            const creatorResponse = await databases.getDocument(
              databaseId,
              userCollectionId,
              event.createdBy
            );

            // Get academic period info if available
            let academicPeriodInfo = null;
            if (event.academicPeriodId) {
              try {
                academicPeriodInfo = await databases.getDocument(
                  databaseId,
                  academicPeriodCollectionId,
                  event.academicPeriodId
                );
              } catch (error) {
                console.error("Error fetching academic period:", error);
              }
            }

            return {
              ...event,
              participants: eventParticipants,
              participantCounts,
              creatorName: creatorResponse.name || "Unknown",
              academicPeriod: academicPeriodInfo
                ? {
                    schoolYear: academicPeriodInfo.schoolYear,
                    periodType: academicPeriodInfo.periodType,
                    isActive: academicPeriodInfo.isActive,
                  }
                : null,
            };
          } catch (error) {
            console.error(
              `Error fetching details for event ${event.$id}:`,
              error
            );
            return {
              ...event,
              participants: [],
              participantCounts: {
                total: 0,
                male: 0,
                female: 0,
                students: 0,
                staffFaculty: 0,
                community: 0,
              },
              creatorName: "Unknown",
              academicPeriod: null,
            };
          }
        })
      );

      setEvents(eventsWithParticipants);
    } catch (error) {
      console.error("Error fetching events:", error);
      setError("Failed to fetch events");
    } finally {
      setLoading(false);
    }
  };

  const filteredEvents = events.filter((event) => {
    const eventName = event.eventName?.toLowerCase() || "";
    const eventVenue = event.eventVenue?.toLowerCase() || "";
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      eventName.includes(searchLower) || eventVenue.includes(searchLower);
    const matchesStatus =
      statusFilter === "All" || event.approvalStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const sortedEvents = [...filteredEvents].sort((a, b) => {
    switch (sortCriteria) {
      case "eventName":
        return a.eventName.localeCompare(b.eventName);
      case "eventNameDesc":
        return b.eventName.localeCompare(a.eventName);
      case "eventDate":
        return new Date(a.eventDate) - new Date(b.eventDate);
      case "eventDateDesc":
        return new Date(b.eventDate) - new Date(a.eventDate);
      case "eventVenue":
        return a.eventVenue.localeCompare(b.eventVenue);
      case "eventVenueDesc":
        return b.eventVenue.localeCompare(a.eventVenue);
      case "createdAt":
        return new Date(a.$createdAt) - new Date(b.$createdAt);
      case "createdAtDesc":
      default:
        return new Date(b.$createdAt) - new Date(a.$createdAt);
    }
  });

  const paginatedEvents = sortedEvents.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const totalPages = Math.ceil(sortedEvents.length / rowsPerPage);

  const handleUpdateEvent = async (updatedEvent) => {
    try {
      await databases.updateDocument(
        databaseId,
        eventCollectionId,
        updatedEvent.$id,
        updatedEvent
      );

      await fetchData(); // Refresh data
      toast.success("Event updated successfully");
    } catch (error) {
      console.error("Error updating event:", error);
      toast.error("Failed to update event");
    }
  };

  const handleAddParticipant = async (newParticipant) => {
    try {
      // Create the new participant document
      const response = await databases.createDocument(
        databaseId,
        studentsCollectionId,
        ID.unique(),
        {
          ...newParticipant,
          eventId: selectedEvent.$id,
          isArchived: false,
        }
      );

      // Update the local state
      setParticipants((prevParticipants) => [...prevParticipants, response]);

      // Update the event's participant counts
      const updatedEvent = {
        ...selectedEvent,
        participantCounts: {
          ...selectedEvent.participantCounts,
          total: selectedEvent.participantCounts.total + 1,
          [newParticipant.sex.toLowerCase()]:
            selectedEvent.participantCounts[newParticipant.sex.toLowerCase()] +
            1,
        },
      };

      setSelectedEvent(updatedEvent);

      // Update the events list with new participant count
      setEvents(
        events.map((event) =>
          event.$id === selectedEvent.$id ? updatedEvent : event
        )
      );

      toast({
        title: "Success",
        description: "Participant added successfully",
      });
    } catch (error) {
      console.error("Error adding participant:", error);
      toast({
        title: "Error",
        description: "Failed to add participant",
        variant: "destructive",
      });
    }
  };

  if (error) {
    return (
      <div className="p-4 text-red-500">
        <p>{error}</p>
        <Button onClick={fetchData}>Retry</Button>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Event Log</CardTitle>
        <CardDescription>
          View and manage all events and their participants
        </CardDescription>
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div className="bg-primary text-primary-foreground p-4 rounded-lg">
            <h3 className="text-lg font-semibold">Total Events</h3>
            <p className="text-3xl font-bold">{events.length}</p>
          </div>
          <div className="bg-green-600 text-primary-foreground p-4 rounded-lg">
            <h3 className="text-lg font-semibold">Total Participants</h3>
            <p className="text-3xl font-bold">
              {events.reduce(
                (sum, event) => sum + event.participantCounts.total,
                0
              )}
            </p>
            <div className="text-xs mt-2">
              <div className="flex justify-between">
                <span>Students:</span>
                <span>
                  {events.reduce(
                    (sum, event) => sum + event.participantCounts.students,
                    0
                  )}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Staff/Faculty:</span>
                <span>
                  {events.reduce(
                    (sum, event) => sum + event.participantCounts.staffFaculty,
                    0
                  )}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Community:</span>
                <span>
                  {events.reduce(
                    (sum, event) => sum + event.participantCounts.community,
                    0
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Search and Filter Controls */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-2">
            <Input
              placeholder="Search by event name or venue"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64"
            />
            <Select
              onValueChange={setSortCriteria}
              defaultValue="createdAtDesc"
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="createdAtDesc">Newest First</SelectItem>
                <SelectItem value="createdAt">Oldest First</SelectItem>
                <SelectItem value="eventDate">Event Date</SelectItem>
                <SelectItem value="eventDateDesc">Event Date (Desc)</SelectItem>
                <SelectItem value="eventName">Event Name (A-Z)</SelectItem>
                <SelectItem value="eventNameDesc">Event Name (Z-A)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex space-x-2">
            <ExportEventsButton events={events} />
            <GenerateReportButton events={events} />
          </div>
        </div>

        {/* Events Table */}
        <div className="rounded-md border">
          <div className="flex items-center justify-end p-4 space-x-2">
            <span className="text-sm text-gray-600">Rows per page:</span>
            <Select
              value={rowsPerPage.toString()}
              onValueChange={(value) => {
                setRowsPerPage(Number(value));
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-[70px]">
                <SelectValue placeholder={rowsPerPage} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="15">15</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead
                  className="bg-gray-100 text-black hover:bg-gray-200 transition-colors cursor-pointer"
                  onClick={() =>
                    setSortCriteria(
                      sortCriteria === "eventName"
                        ? "eventNameDesc"
                        : "eventName"
                    )
                  }
                >
                  Event Name
                  <ArrowUpDown className="ml-2 h-4 w-4 inline" />
                </TableHead>
                <TableHead
                  className="bg-gray-100 text-black hover:bg-gray-200 transition-colors cursor-pointer"
                  onClick={() =>
                    setSortCriteria(
                      sortCriteria === "eventDate"
                        ? "eventDateDesc"
                        : "eventDate"
                    )
                  }
                >
                  Date
                  <ArrowUpDown className="ml-2 h-4 w-4 inline" />
                </TableHead>
                <TableHead
                  className="bg-gray-100 text-black hover:bg-gray-200 transition-colors cursor-pointer"
                  onClick={() =>
                    setSortCriteria(
                      sortCriteria === "eventVenue"
                        ? "eventVenueDesc"
                        : "eventVenue"
                    )
                  }
                >
                  Venue
                  <ArrowUpDown className="ml-2 h-4 w-4 inline" />
                </TableHead>
                <TableHead className="bg-gray-100 text-black text-center">
                  Participants
                  <ArrowUpDown className="ml-2 h-4 w-4 inline" />
                </TableHead>

                <TableHead className="bg-gray-100 text-black">
                  Created By
                  <ArrowUpDown className="ml-2 h-4 w-4 inline" />
                </TableHead>
                <TableHead
                  className="bg-gray-100 text-black hover:bg-gray-200 transition-colors cursor-pointer"
                  onClick={() =>
                    setSortCriteria(
                      sortCriteria === "createdAt"
                        ? "createdAtDesc"
                        : "createdAt"
                    )
                  }
                >
                  Created At
                  <ArrowUpDown className="ml-2 h-4 w-4 inline" />
                </TableHead>
                <TableHead className="bg-gray-100 text-black text-center">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedEvents.map((event) => (
                <TableRow key={event.$id}>
                  <TableCell className="font-medium">
                    {event.eventName}
                  </TableCell>
                  <TableCell>
                    {format(new Date(event.eventDate), "MMM dd, yyyy")}
                  </TableCell>
                  <TableCell>{event.eventVenue}</TableCell>
                  <TableCell className="text-center">
                    <div className="flex flex-col items-center">
                      <div>Total: {event.participantCounts.total}</div>
                      <div className="text-xs text-muted-foreground space-x-2">
                        <span>S: {event.participantCounts.students} |</span>
                        <span>F: {event.participantCounts.staffFaculty} |</span>
                        <span>C: {event.participantCounts.community}</span>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">
                        {event.creatorName}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {format(new Date(event.$createdAt), "MMM dd, yyyy h:mm a")}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-4">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setSelectedEvent(event);
                          setShowParticipants(true);
                        }}
                        className="flex flex-col items-center gap-1 h-auto py-2"
                      >
                        <Eye className="h-4 w-4" />
                        <span className="text-xs">View</span>
                      </Button>
                      <EditEvent
                        event={event}
                        onUpdateEvent={handleUpdateEvent}
                        trigger={
                          <Button
                            size="sm"
                            variant="ghost"
                            className="flex flex-col items-center gap-1 h-auto py-2"
                          >
                            <Edit className="h-4 w-4" />
                            <span className="text-xs">Edit</span>
                          </Button>
                        }
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Pagination Controls */}
          <div className="flex items-center justify-between px-4 py-4 border-t">
            <div className="text-sm text-gray-600">
              Showing {(currentPage - 1) * rowsPerPage + 1} to{" "}
              {Math.min(currentPage * rowsPerPage, sortedEvents.length)} of{" "}
              {sortedEvents.length} entries
            </div>
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  />
                </PaginationItem>
                {[...Array(totalPages)].map((_, i) => (
                  <PaginationItem key={i + 1}>
                    <PaginationLink
                      onClick={() => setCurrentPage(i + 1)}
                      isActive={currentPage === i + 1}
                    >
                      {i + 1}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={currentPage === totalPages}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </div>
      </CardContent>
      {/* Add these dialogs at the bottom of your return statement */}
      <EventDetailsDialog
        event={selectedEvent}
        isOpen={showEventDetails}
        onClose={() => {
          setShowEventDetails(false);
          setSelectedEvent(null);
        }}
      />
      <ViewParticipants
        isOpen={showParticipants}
        onClose={() => setShowParticipants(false)}
        participants={participants}
        selectedEvent={selectedEvent}
        onAddParticipant={handleAddParticipant}
      />
    </Card>
  );
}

const EventDetailsDialog = ({ event, isOpen, onClose }) => {
  if (!event) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Event Details</DialogTitle>
        </DialogHeader>

        {/* Event Details Section */}
        <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
          <div>
            <label className="text-sm font-medium text-gray-500">
              Event Name
            </label>
            <p className="mt-1">{event?.eventName}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">
              Event Date
            </label>
            <p className="mt-1">
              {format(new Date(event?.eventDate), "MMMM dd, yyyy")}
            </p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">
              Event Time
            </label>
            <p className="mt-1">{event?.eventTime}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Venue</label>
            <p className="mt-1">{event?.eventVenue}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">
              Event Type
            </label>
            <p className="mt-1">{event?.eventType}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">
              Created By
            </label>
            <p className="mt-1">{event?.creatorName}</p>
          </div>
          <div className="col-span-2">
            <label className="text-sm font-medium text-gray-500">
              Description
            </label>
            <p className="mt-1">{event?.eventDescription}</p>
          </div>
        </div>

        {/* Existing Participants Section */}
        <DialogTitle className="text-lg font-semibold mb-4">
          Participants
        </DialogTitle>
        {/* ... rest of your existing participants table ... */}
      </DialogContent>
    </Dialog>
  );
};
