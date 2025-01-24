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
import { Edit, Eye, Plus } from "lucide-react";
import { format } from "date-fns";
import { toast } from "react-toastify";
import {
  getCurrentUser,
  fetchEventParticipantLogData,
  getEventParticipantCounts,
  updateEvent,
  updateParticipant,
  deleteParticipant,
} from "@/lib/appwrite";
import { LoadingAnimation } from "@/components/loading/loading-animation";
import EditEvent from "./edit-event-dialog/page";
import ViewParticipants from "./view-participant-dialog/page";
import ExportEventsButton from "./export-event/page";
import GenerateReportButton from "./import-event/page";

export default function EventParticipantLog() {
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [staffFaculty, setStaffFaculty] = useState([]);
  const [community, setCommunity] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState(null);
  const [sortCriteria, setSortCriteria] = useState("eventDate");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showParticipants, setShowParticipants] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [editingParticipant, setEditingParticipant] = useState(null);
  const [isAddingParticipant, setIsAddingParticipant] = useState(false);
  const [newParticipant, setNewParticipant] = useState({
    name: "",
    studentId: "",
    eventId: "",
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const user = await getCurrentUser();
      if (!user) {
        throw new Error("No authenticated user found");
      }
      setCurrentUser(user);

      const data = await fetchEventParticipantLogData(user.$id);
      setEvents(data.events);
      setParticipants(data.participants);
      setStaffFaculty(data.staffFaculty);
      setCommunity(data.community);
    } catch (error) {
      console.error("Error fetching data:", error);
      setError(error.message || "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (events.length === 0) {
    return null;
  }

  if (loading) {
    return <LoadingAnimation message="Loading Events..." />;
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

  const getParticipantCounts = (eventId) => {
    return getEventParticipantCounts(
      eventId,
      participants,
      staffFaculty,
      community
    );
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
      return getParticipantCounts(b.$id) - getParticipantCounts(a.$id);
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
    if (!currentUser || !editingParticipant) return;
    try {
      await updateParticipant(editingParticipant.$id, {
        ...editingParticipant,
        updatedBy: currentUser.$id,
      });

      setParticipants((prevParticipants) =>
        prevParticipants.map((p) =>
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
        <CardTitle>Events </CardTitle>
        <CardDescription>View and manage event participants</CardDescription>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-primary text-primary-foreground p-4 rounded-lg">
            <h3 className="text-lg font-semibold">Total Events</h3>
            <p className="text-3xl font-bold">{events.length}</p>
          </div>
          <div className="bg-green-600 text-primary-foreground p-4 rounded-lg">
            <h3 className="text-lg font-semibold">Academic Events</h3>
            <p className="text-3xl font-bold">
              {events.filter((e) => e.eventType === "Academic").length}
            </p>
          </div>
          <div className="bg-blue-600 text-primary-foreground p-4 rounded-lg">
            <h3 className="text-lg font-semibold">Non-Academic Events</h3>
            <p className="text-3xl font-bold">
              {events.filter((e) => e.eventType === "Non-Academic").length}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
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
                defaultValue={sortCriteria}
              >
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
              <Select
                onValueChange={setStatusFilter}
                defaultValue={statusFilter}
              >
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
                          (M: {participantCounts.male} | F:{" "}
                          {participantCounts.female})
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
        </div>
      </CardContent>

      {showParticipants && (
        <ViewParticipants
          isOpen={showParticipants}
          onClose={() => {
            setShowParticipants(false);
            setEditingParticipant(null);
          }}
          participants={participants}
          staffFaculty={staffFaculty}
          community={community}
          selectedEvent={selectedEvent}
          onEditParticipant={setEditingParticipant}
          onDeleteParticipant={handleDeleteParticipant}
          onAddParticipant={handleAddParticipant}
          editingParticipant={editingParticipant}
          onSaveEdit={handleSaveParticipantEdit}
        />
      )}
    </Card>
  );
}
