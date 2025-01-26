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
  participantCollectionId,
  userCollectionId,
  client,
  getCurrentAcademicPeriod,
} from "@/lib/appwrite";
import { Query } from "appwrite";
import { Eye, Edit } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ID } from "appwrite";

import AddParticipant from "./add-participant-dialog/page";
import EditEvent from "./edit-event-dialog/page";
import ViewParticipants from "./view-participant-dialog/page";
import ExportEventsButton from "./export-event/page";
import GenerateReportButton from "./import-event/page";

export default function EventParticipantLog() {
  const [events, setEvents] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortCriteria, setSortCriteria] = useState("eventDate");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showParticipants, setShowParticipants] = useState(false);
  const [showEventDetails, setShowEventDetails] = useState(false);

  useEffect(() => {
    fetchData();

    // Subscribe to event changes
    const eventUnsubscribe = client.subscribe(
      `databases.${databaseId}.collections.${eventCollectionId}.documents`,
      (response) => {
        console.log("Event update received:", response);
        fetchData(); // Refresh all data when any event changes
      }
    );

    // Subscribe to participant changes
    const participantUnsubscribe = client.subscribe(
      `databases.${databaseId}.collections.${participantCollectionId}.documents`,
      (response) => {
        console.log("Participant update received:", response);
        fetchData(); // Refresh all data when any participant changes
      }
    );

    // Cleanup subscriptions
    return () => {
      eventUnsubscribe();
      participantUnsubscribe();
    };
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const currentPeriod = await getCurrentAcademicPeriod();

      if (!currentPeriod) {
        throw new Error("No active academic period found");
      }

      // Fetch events first
      const response = await databases.listDocuments(
        databaseId,
        eventCollectionId,
        [
          Query.equal("isArchived", false),
          Query.equal("academicPeriodId", currentPeriod.$id),
          Query.orderDesc("createdAt"),
        ]
      );

      // Get all event IDs from the current period
      const eventIds = response.documents.map((event) => event.$id);

      // Fetch all participants for these events in one query
      const allParticipantsResponse = await databases.listDocuments(
        databaseId,
        participantCollectionId,
        [Query.equal("isArchived", false), Query.equal("eventId", eventIds)]
      );

      // Get creator information and combine with event data
      const eventsWithParticipants = await Promise.all(
        response.documents.map(async (event) => {
          try {
            // Filter participants for this specific event
            const eventParticipants = allParticipantsResponse.documents.filter(
              (p) => p.eventId === event.$id
            );

            // Calculate participant counts
            const participantCounts = {
              total: eventParticipants.length,
              male: eventParticipants.filter((p) => p.sex === "Male").length,
              female: eventParticipants.filter((p) => p.sex === "Female")
                .length,
            };

            // Fetch creator information
            const creatorResponse = await databases.getDocument(
              databaseId,
              userCollectionId,
              event.createdBy
            );

            return {
              ...event,
              participants: eventParticipants,
              participantCounts: participantCounts,
              creatorName: creatorResponse.name || "Unknown",
            };
          } catch (error) {
            console.error(
              `Error fetching details for event ${event.$id}:`,
              error
            );
            return {
              ...event,
              participants: [],
              participantCounts: { total: 0, male: 0, female: 0 },
              creatorName: "Unknown",
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
      case "all":
        return 0; // No sorting, maintain original order
      case "eventDate":
        return new Date(b.eventDate) - new Date(a.eventDate);
      case "eventName":
        return a.eventName.localeCompare(b.eventName);
      case "participantCount":
        return b.totalParticipants - a.totalParticipants;
      default:
        return 0;
    }
  });

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
        participantCollectionId,
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

  if (loading) {
    return <LoadingAnimation />;
  }

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
        <div className="mt-4 grid grid-cols-3 gap-4">
          <div className="bg-primary text-primary-foreground p-4 rounded-lg">
            <h3 className="text-lg font-semibold">Total Events</h3>
            <p className="text-3xl font-bold">{events.length}</p>
          </div>
          <div className="bg-green-600 text-primary-foreground p-4 rounded-lg">
            <h3 className="text-lg font-semibold">Total Participants</h3>
            <p className="text-3xl font-bold">
              {events.reduce(
                (sum, event) => sum + (event.participantCounts?.total || 0),
                0
              )}
            </p>
          </div>
          <div className="bg-blue-600 text-primary-foreground p-4 rounded-lg">
            <h3 className="text-lg font-semibold">Active Events</h3>
            <p className="text-3xl font-bold">
              {events.filter((e) => new Date(e.eventDate) >= new Date()).length}
            </p>
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
            <Select onValueChange={setSortCriteria} defaultValue={sortCriteria}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="eventDate">Event Date</SelectItem>
                <SelectItem value="eventName">Event Name</SelectItem>
                <SelectItem value="participantCount">
                  Participant Count
                </SelectItem>
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Event Name</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-center">
                  Participants (M/F)
                </TableHead>
                <TableHead>Created By</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedEvents.map((event) => (
                <TableRow key={event.$id}>
                  <TableCell className="font-medium">
                    {event.eventName}
                  </TableCell>
                  <TableCell>
                    {format(new Date(event.eventDate), "MMM dd, yyyy")}
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex flex-col items-center">
                      <div>Total: {event.participantCounts.total}</div>
                      <div className="text-sm text-muted-foreground">
                        <span className="text-blue-600">
                          {event.participantCounts.male}
                        </span>
                        /
                        <span className="text-pink-600">
                          {event.participantCounts.female}
                        </span>
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
