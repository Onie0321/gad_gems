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
} from "@/lib/appwrite";
import { Query } from "appwrite";

import AddParticipant from "./add-participant-dialog/page";
import EditEvent from "./edit-event-dialog/page";
import DeleteEvent from "./delete-event-dialog/page";
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

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch all events
      const eventsResponse = await databases.listDocuments(
        databaseId,
        eventCollectionId,
        [Query.orderDesc("eventDate")]
      );

      const events = eventsResponse.documents;

      // Fetch all users first to avoid multiple queries
      const usersResponse = await databases.listDocuments(
        databaseId,
        userCollectionId
      );
      const users = usersResponse.documents;

      // Fetch participants for each event
      const eventsWithParticipants = await Promise.all(
        events.map(async (event) => {
          const participantsResponse = await databases.listDocuments(
            databaseId,
            participantCollectionId,
            [Query.equal("eventId", event.$id)]
          );

          const participants = participantsResponse.documents;

          // Calculate gender distribution
          const genderCounts = {
            male: participants.filter((p) => p.sex === "Male").length,
            female: participants.filter((p) => p.sex === "Female").length,
            intersex: participants.filter((p) => p.sex === "Intersex").length,
          };

          // Find the creator's name from users
          const creator = users.find((user) => user.$id === event.createdBy);
          const creatorName = creator ? creator.name : "Unknown";

          return {
            ...event,
            participants: participants,
            participantCounts: genderCounts,
            totalParticipants: participants.length,
            creatorName: creatorName, // Add creator name
          };
        })
      );

      setEvents(eventsWithParticipants);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Failed to fetch data");
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

  const handleDeleteEvent = async (eventId) => {
    try {
      // Delete event
      await databases.deleteDocument(databaseId, eventCollectionId, eventId);

      // Delete associated participants
      const participantsToDelete = await databases.listDocuments(
        databaseId,
        participantCollectionId,
        [Query.equal("eventId", eventId)]
      );

      await Promise.all(
        participantsToDelete.documents.map((participant) =>
          databases.deleteDocument(
            databaseId,
            participantCollectionId,
            participant.$id
          )
        )
      );

      await fetchData(); // Refresh data
      toast.success("Event and associated participants deleted successfully");
    } catch (error) {
      console.error("Error deleting event:", error);
      toast.error("Failed to delete event");
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
              {events.reduce((sum, event) => sum + event.totalParticipants, 0)}
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
                <SelectItem value="eventDate">Event Date</SelectItem>
                <SelectItem value="eventName">Event Name</SelectItem>
                <SelectItem value="participantCount">
                  Participant Count
                </SelectItem>
              </SelectContent>
            </Select>
            <Select onValueChange={setStatusFilter} defaultValue={statusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
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
                <TableHead>Time</TableHead>
                <TableHead>Venue</TableHead>
                <TableHead className="text-center">
                  Participants (M/F/I)
                </TableHead>
                <TableHead>Created By</TableHead> {/* New column */}
                <TableHead>Status</TableHead>
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
                  <TableCell>
                    {format(new Date(event.eventTimeFrom), "hh:mm a")} -
                    {format(new Date(event.eventTimeTo), "hh:mm a")}
                  </TableCell>
                  <TableCell>{event.eventVenue}</TableCell>
                  <TableCell className="text-center">
                    {event.participantCounts.male}/
                    {event.participantCounts.female}/
                    {event.participantCounts.intersex}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">
                        {event.creatorName}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Select
                        defaultValue={event.approvalStatus}
                        onValueChange={async (newStatus) => {
                          try {
                            await databases.updateDocument(
                              databaseId,
                              eventCollectionId,
                              event.$id,
                              { approvalStatus: newStatus }
                            );
                            await fetchData();
                            toast.success(
                              `Event status updated to ${newStatus}`
                            );
                          } catch (error) {
                            console.error(
                              "Error updating event status:",
                              error
                            );
                            toast.error("Failed to update event status");
                          }
                        }}
                      >
                        <SelectTrigger
                          className={`w-24 h-7 text-xs justify-center
                          ${
                            event.approvalStatus === "approved"
                              ? "bg-green-100 text-green-800"
                              : event.approvalStatus === "rejected"
                              ? "bg-red-100 text-red-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          <SelectValue placeholder={event.approvalStatus} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="approved">Approved</SelectItem>
                          <SelectItem value="rejected">Rejected</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setSelectedEvent(event);
                          setShowParticipants(true);
                        }}
                      >
                        View
                      </Button>
                      <EditEvent
                        event={event}
                        onUpdateEvent={handleUpdateEvent}
                      />
                      <DeleteEvent
                        eventId={event.$id}
                        onDeleteEvent={handleDeleteEvent}
                      />
                      <ViewParticipants
                        event={event}
                        participants={event.participants}
                        show={
                          showParticipants && selectedEvent?.$id === event.$id
                        }
                        onClose={() => setShowParticipants(false)}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
      {/* Add this before the closing Card tag */}
      {selectedEvent && (
        <ViewParticipants
          isOpen={showParticipants}
          onClose={() => {
            setShowParticipants(false);
            setSelectedEvent(null);
          }}
          participants={selectedEvent.participants || []}
          selectedEvent={selectedEvent}
          onAddParticipant={async (participant, participantId) => {
            try {
              await fetchData(); // Refresh the data after adding/updating participant
              toast.success(
                participantId
                  ? "Participant updated successfully!"
                  : "Participant added successfully!"
              );
            } catch (error) {
              console.error("Error updating participants:", error);
              toast.error("Failed to update participants");
            }
          }}
        />
      )}
    </Card>
  );
}
