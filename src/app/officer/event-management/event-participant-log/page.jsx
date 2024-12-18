import React, { useState, useMemo, useEffect } from "react";
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
import {
  Users,
  BarChart,
  Edit,
  Eye,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "react-toastify";
import {
  getEvents,
  databases,
  eventCollectionId,
  participantCollectionId,
  getParticipants,
  subscribeToRealTimeUpdates,
  createEvent,
  updateEvent,
  createParticipant,
  updateParticipant,
  deleteParticipant,
  getCurrentUser,
  subscribeToEventUpdates,
  databaseId
} from "@/lib/appwrite";
import { Query } from "appwrite";
import { LoadingAnimation } from "@/components/loading/loading-animation";

import AddParticipant from "./add-participant-dialog/page";
import EditEvent from "./edit-event-dialog/page";
import ViewParticipants from "./view-participant-dialog/page";
import ExportEventsButton from "./export-event/page";
import GenerateReportButton from "./import-event/page";

export default function EventParticipantLog() {
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState(null);
  const [sortCriteria, setSortCriteria] = useState("eventDate");
  const [statusFilter, setStatusFilter] = useState("All");
  const [editingEvent, setEditingEvent] = useState(null);
  const [editingParticipant, setEditingParticipant] = useState(null);
  const [newEvent, setNewEvent] = useState({
    name: "",
    date: "",
    venue: "",
    status: "Pending",
  });
  const [newParticipant, setNewParticipant] = useState({
    name: "",
    studentId: "",
    eventId: "",
  });
  const [isAddingEvent, setIsAddingEvent] = useState(false);
  const [isAddingParticipant, setIsAddingParticipant] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showParticipants, setShowParticipants] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  const summaryStats = useMemo(
    () => ({
      total: events.length,
      academic: events.filter((e) => e.eventType === "Academic").length,
      nonAcademic: events.filter((e) => e.eventType === "Non-Academic").length,
    }),
    [events]
  );

  const fetchData = async (userId) => {
    try {
      setLoading(true);
      const response = await databases.listDocuments(
        databaseId,
        eventCollectionId,
        [Query.equal("createdBy", userId)]
      );

      if (response.documents.length > 0) {
        setEvents(response.documents);

        const participantsResponse = await databases.listDocuments(
          databaseId,
          participantCollectionId,
          [
            Query.equal("eventId", response.documents.map(event => event.$id))
          ]
        );

        setParticipants(participantsResponse.documents);
      } else {
        setEvents([]);
        setParticipants([]);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      setError("Failed to fetch data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchUserAndData = async () => {
      try {
        const user = await getCurrentUser();
        setCurrentUser(user);
        if (user) {
          await fetchData(user.$id);

          const unsubscribeEvents = subscribeToEventUpdates(() =>
            fetchData(user.$id)
          );
          const unsubscribeParticipants = subscribeToRealTimeUpdates(
            participantCollectionId,
            () => fetchData(user.$id)
          );

          return () => {
            unsubscribeEvents();
            unsubscribeParticipants();
          };
        }
      } catch (error) {
        console.error("Error fetching current user:", error);
        setError("Failed to authenticate user.");
        setLoading(false);
      }
    };

    fetchUserAndData();
  }, []);

  if (loading) {
    return <LoadingAnimation message="Loading participant logs..." />;
  }

  if (error) {
    return (
      <div className="text-center text-red-500">
        <p>{error}</p>
        <Button
          onClick={() => getCurrentUser().then((user) => fetchData(user.id))}
          className="mt-4"
        >
          Retry
        </Button>
      </div>
    );
  }

  if (!currentUser) {
    return <div>Please log in to view the Event Participant Log.</div>;
  }

  const getParticipantCount = (eventId) => {
    return participants.filter((p) => p.eventId === eventId).length;
  };

  const filteredEvents = events.filter((event) => {
    const eventName = event.eventName?.toLowerCase() || "";
    const eventVenue = event.eventVenue?.toLowerCase() || "";
    const matchesSearch =
      eventName.includes(searchTerm.toLowerCase()) ||
      eventVenue.includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "All" ||
      event.approvalStatus?.toLowerCase() === statusFilter.toLowerCase() ||
      event.status?.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  const sortedEvents = [...filteredEvents].sort((a, b) => {
    if (sortCriteria === "eventDate")
      return new Date(b.eventDate) - new Date(a.eventDate);
    if (sortCriteria === "eventName") {
      return a.eventName.localeCompare(b.eventName);
    }
    if (sortCriteria === "participantCount")
      return getParticipantCount(b.$id) - getParticipantCount(a.$id);
    return 0;
  });

  const handleUpdateEvent = async (updatedEvent) => {
    if (!currentUser) return;
    try {
      const updated = await updateEvent(updatedEvent.$id, {
        ...updatedEvent,
        updatedBy: currentUser.id,
      });
      setEvents((prevEvents) =>
        prevEvents.map((event) =>
          event.$id === updatedEvent.$id ? { ...event, ...updated } : event
        )
      );
      toast.success("Event updated successfully");
    } catch (error) {
      console.error("Error updating event:", error);
      toast.error("Failed to update event.");
    }
  };

  const handleAddEvent = async () => {
    if (!currentUser) return;
    try {
      const createdEvent = await createEvent({
        ...newEvent,
        createdBy: currentUser.id,
      });
      setEvents([...events, createdEvent]);
      setNewEvent({ name: "", date: "", venue: "", status: "Pending" });
      setIsAddingEvent(false);
      toast.success("New event added successfully");
    } catch (error) {
      console.error("Error adding event:", error);
      toast.error("Failed to add event.");
    }
  };

  const handleAddParticipant = async () => {
    if (!currentUser) return;
    if (
      participants.some(
        (p) =>
          p.studentId === newParticipant.studentId &&
          p.eventId === newParticipant.eventId
      )
    ) {
      toast.error(
        "This participant is already registered for the selected event"
      );
      return;
    }
    try {
      const createdParticipant = await createParticipant({
        ...newParticipant,
        createdBy: currentUser.id,
        eventId: selectedEvent.$id,
      });
      setParticipants([...participants, createdParticipant]);
      setNewParticipant({ name: "", studentId: "", eventId: "" });
      setIsAddingParticipant(false);
      toast.success("New participant added successfully");
    } catch (error) {
      console.error("Error adding participant:", error);
      toast.error("Failed to add participant.");
    }
  };

  const handleSaveParticipantEdit = async () => {
    if (!currentUser) return;
    try {
      await updateParticipant(editingParticipant.$id, {
        ...editingParticipant,
        updatedBy: currentUser.id,
      });
      setParticipants(
        participants.map((p) =>
          p.$id === editingParticipant.$id ? editingParticipant : p
        )
      );
      setEditingParticipant(null);
      toast.success("Participant updated successfully");
    } catch (error) {
      console.error("Error updating participant:", error);
      toast.error("Failed to update participant");
    }
  };

  const handleDeleteParticipant = async (participantId) => {
    if (!currentUser) return;
    if (
      window.confirm(
        "Are you sure you want to delete this participant? This action cannot be undone."
      )
    ) {
      try {
        await deleteParticipant(participantId, currentUser.id);
        setParticipants(participants.filter((p) => p.$id !== participantId));
        toast.success("Participant deleted successfully");
      } catch (error) {
        console.error("Error deleting participant:", error);
        toast.error("Failed to delete participant");
      }
    }
  };

  const getParticipantCounts = (eventId) => {
    const eventParticipants = participants.filter((p) => p.eventId === eventId);
    const maleCount = eventParticipants.filter((p) => p.sex === "Male").length;
    const femaleCount = eventParticipants.filter(
      (p) => p.sex === "Female"
    ).length;
    const intersexCount = eventParticipants.filter(
      (p) => p.sex === "Intersex"
    ).length;

    return {
      total: eventParticipants.length,
      male: maleCount,
      female: femaleCount,
      intersex: intersexCount,
    };
  };

  const getStatusStyles = (status, approvalStatus) => {
    if (approvalStatus) {
      switch (approvalStatus.toLowerCase()) {
        case "approved":
          return "bg-green-100 text-green-800";
        case "rejected":
          return "bg-red-100 text-red-800";
        case "pending":
          return "bg-yellow-100 text-yellow-800";
      }
    }

    switch (status?.toLowerCase()) {
      case "approved":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

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
            <p className="text-3xl font-bold">{summaryStats.total}</p>
          </div>
          <div className="bg-green-600 text-primary-foreground p-4 rounded-lg">
            <h3 className="text-lg font-semibold">Academic Events</h3>
            <p className="text-3xl font-bold">{summaryStats.academic}</p>
          </div>
          <div className="bg-blue-600 text-primary-foreground p-4 rounded-lg">
            <h3 className="text-lg font-semibold">Non-Academic Events</h3>
            <p className="text-3xl font-bold">{summaryStats.nonAcademic}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
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
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Ongoing">Ongoing</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex space-x-2">
            <ExportEventsButton />
            <GenerateReportButton />
          </div>
        </div>
        <div className="max-h-[330px] overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Event Name</TableHead>
                <TableHead>Event Date</TableHead>
                <TableHead className="text-center">Venue</TableHead>
                <TableHead className="text-center">Participant</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedEvents.map((event) => {
                const participantCounts = getParticipantCounts(event.$id);

                return (
                  <TableRow key={event.$id}>
                    <TableCell className="font-medium">
                      {event.eventName}
                    </TableCell>
                    <TableCell>
                      {format(new Date(event.eventDate), "MM/dd/yyyy")}
                    </TableCell>
                    <TableCell className="text-center">
                      {event.eventVenue}
                    </TableCell>
                    <TableCell className="text-center">
                      <div>Total: {participantCounts.total}</div>
                      <div className="text-sm text-muted-foreground">
                        (M: {participantCounts.male} | F: {participantCounts.female} | I: {participantCounts.intersex})
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <div className="flex flex-col items-center">
                          <EditEvent
                            event={event}
                            onUpdateEvent={handleUpdateEvent}
                          />
                          <span className="text-xs mt-1">Edit</span>
                        </div>
                        <div className="flex flex-col items-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedEvent(event);
                              setShowParticipants(true);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <span className="text-xs mt-1">View</span>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      {showParticipants && (
        <ViewParticipants
          isOpen={showParticipants}
          onClose={() => setShowParticipants(false)}
          participants={participants}
          selectedEvent={selectedEvent}
          onEditParticipant={setEditingParticipant}
          onDeleteParticipant={handleDeleteParticipant}
          onAddParticipant={handleAddParticipant}
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Sex</TableHead>
                <TableHead>Age</TableHead>
                <TableHead>School</TableHead>
                <TableHead>Added By</TableHead>
                <TableHead>Added On</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {participants
                .filter((p) => p.eventId === selectedEvent.$id)
                .map((participant) => (
                  <TableRow key={participant.$id}>
                    <TableCell>{participant.studentId}</TableCell>
                    <TableCell>{participant.name}</TableCell>
                    <TableCell>{participant.sex}</TableCell>
                    <TableCell>{participant.age}</TableCell>
                    <TableCell>{participant.school}</TableCell>
                    <TableCell>{participant.createdByName}</TableCell>
                    <TableCell>
                      {format(
                        new Date(participant.$createdAt),
                        "MM/dd/yyyy HH:mm"
                      )}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          participant.status === "pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-green-100 text-green-800"
                        }`}
                      >
                        {participant.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingParticipant(participant)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            handleDeleteParticipant(participant.$id)
                          }
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </ViewParticipants>
      )}
    </Card>
  );
}
