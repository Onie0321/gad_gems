import React, { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { Label } from "@/components/ui/label";
import { Users, BarChart, Edit, Trash2, Plus, Eye } from "lucide-react";
import { format } from "date-fns";
import { toast } from "react-toastify";
import {
  getEvents,
  databases,
  eventCollectionId,
  participantCollectionId,
  getParticipants,
  subscribeToRealTimeUpdates,
} from "@/lib/appwrite";

import AddParticipant from "./add-participant-dialog/page";
import EditEvent from "./edit-event-dialog/page";
import DeleteEvent from "./delete-event-dialog/page";
import ViewParticipants from "./view-participant-dialog/page";
import ExportEventsButton from "./export-event/page";
import GenerateReportButton from "./import-event/page";


export default function EventParticipantLog() {
  const [events, setEvents] = useState([]);
  const [participants, setParticipants] = useState([]); // Define participants with useState
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
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
  const [currentEvent, setCurrentEvent] = useState(null);
  const [selectedEventId, setSelectedEventId] = useState(null);

  useEffect(() => {
    // Simulate fetching event data
    const fetchEvent = async () => {
      const event = await getEvents(); // Replace with your actual API call
      setCurrentEvent(event);
      setSelectedEventId(event?.$id);
    };

    fetchEvent();
  }, []);

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

  const getParticipantCount = (eventId) => {
    return participants.filter((p) => p.eventId === eventId).length;
  };

  const eventData = useMemo(() => {
    return events.map((event) => {
      const eventParticipants = participants.filter(
        (p) => p.eventId === event.id
      );
      return {
        ...event,
        participantCount: eventParticipants.length,
        status: event.status || "Pending", // Assuming event status is stored, otherwise defaulting to 'Pending'
      };
    });
  }, [events, participants]);

  const filteredEvents = events.filter((event) => {
    const eventName = event.eventName?.toLowerCase() || "";
    const eventVenue = event.eventVenue?.toLowerCase() || "";
    const matchesSearch =
      eventName.includes(searchTerm.toLowerCase()) ||
      eventVenue.includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "All" || event.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const sortedEvents = [...filteredEvents].sort((a, b) => {
    if (sortCriteria === "eventDate")
      return new Date(b.eventDate) - new Date(a.eventDate);
    if (sortCriteria === "eventName")
      return (a.eventName || "").localeCompare(b.eventName || "");
    if (sortCriteria === "participantCount")
      return getParticipantCount(b.$id) - getParticipantCount(a.$id);
    return 0;
  });

  const handleUpdateEvent = (updatedEvent) => {
    setEvents((prevEvents) =>
      prevEvents.map((event) =>
        event.$id === updatedEvent.$id ? { ...event, ...updatedEvent } : event
      )
    );
  };

  const handleDeleteEvent = async (eventId) => {
    if (
      window.confirm(
        "Are you sure you want to delete this event? This action cannot be undone."
      )
    ) {
      try {
        await deleteEvent(eventId); // Call deleteEvent function
        setEvents((prevEvents) =>
          prevEvents.filter((event) => event.$id !== eventId)
        );
        toast.success("Event deleted successfully.");
      } catch (error) {
        console.error("Error deleting event:", error);
        toast.error("Failed to delete event.");
      }
    }
  };

  const handleAddEvent = () => {
    const eventId = Date.now().toString(); // Simple ID generation
    setEvents([...events, { ...newEvent, id: eventId }]);
    setNewEvent({ name: "", date: "", venue: "", status: "Pending" });
    setIsAddingEvent(false);
    toast.success("New event added successfully");
  };

  const handleAddParticipant = () => {
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
    setParticipants([
      ...participants,
      { ...newParticipant, id: Date.now().toString() },
    ]);
    setNewParticipant({ name: "", studentId: "", eventId: "" });
    setIsAddingParticipant(false);
    toast.success("New participant added successfully");
  };

  const handleEditParticipant = (participant) => {
    setEditingParticipant({ ...participant });
  };

  const handleSaveParticipantEdit = async () => {
    try {
      await updateParticipant(editingParticipant.$id, editingParticipant);
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
    if (
      window.confirm(
        "Are you sure you want to delete this participant? This action cannot be undone."
      )
    ) {
      try {
        await deleteParticipant(participantId);
        setParticipants(participants.filter((p) => p.$id !== participantId));
        toast.success("Participant deleted successfully");
      } catch (error) {
        console.error("Error deleting participant:", error);
        toast.error("Failed to delete participant");
      }
    }
  };

  const handleViewParticipants = (event) => {
    setSelectedEvent(event);
    setShowParticipants(true);
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

  const getStatusStyles = (status) => {
    if (!status || status.trim() === "") status = "Pending"; // Default to Pending if no status is set
    switch (status) {
      case "Pending":
        return "bg-yellow-100 text-yellow-800";
      case "Ongoing":
        return "bg-green-100 text-green-800";
      case "Completed":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
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
                <SelectItem value="name">Event Name</SelectItem>
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
                <TableHead className="text-center">Status</TableHead>
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
                        (M: {participantCounts.male} | F:{" "}
                        {participantCounts.female})
                      </div>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusStyles(
                          event.status
                        )}`}
                      >
                        {event.status || "Pending"}
                      </span>
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
                          <DeleteEvent
                            eventId={event.$id}
                            onDeleteEvent={handleDeleteEvent}
                          />
                          <span className="text-xs mt-1">Delete</span>
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
          onEditParticipant={handleEditParticipant}
          onDeleteParticipant={handleDeleteParticipant}
          onAddParticipant={handleAddParticipant}
        />
      )}
    </Card>
  );
}
