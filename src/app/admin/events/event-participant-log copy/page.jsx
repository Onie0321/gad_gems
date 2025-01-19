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

      const response = await databases.listDocuments(
        databaseId,
        eventCollectionId,
        [
          Query.equal("academicPeriodId", currentPeriod.$id),
          Query.orderDesc("createdAt"),
        ]
      );

      // Fetch participants for each event
      const eventsWithParticipants = await Promise.all(
        response.documents.map(async (event) => {
          const participantsResponse = await databases.listDocuments(
            databaseId,
            participantCollectionId,
            [
              Query.equal("eventId", event.$id),
              Query.equal("academicPeriodId", currentPeriod.$id),
            ]
          );

          // Calculate participant counts
          const participants = participantsResponse.documents;
          const participantCounts = {
            total: participants.length,
            male: participants.filter((p) => p.sex === "Male").length,
            female: participants.filter((p) => p.sex === "Female").length,
          };

          // Fetch creator information
          const creatorResponse = await databases.getDocument(
            databaseId,
            userCollectionId,
            event.createdBy
          );

          return {
            ...event,
            participants: participants,
            participantCounts: participantCounts,
            creatorName: creatorResponse.name || "Unknown",
          };
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
                <TableHead>Time</TableHead>
                <TableHead>Venue</TableHead>
                <TableHead className="text-center">
                  Participants (M/F)
                </TableHead>
                <TableHead>Created By</TableHead> {/* New column */}
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
          onAddParticipant={async () => {
            await fetchData(); // Refresh data after adding/updating participant
          }}
        />
      )}
    </Card>
  );
}
