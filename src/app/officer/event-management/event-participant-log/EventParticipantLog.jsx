"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
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
  getCurrentAcademicPeriod,
  databases,
  databaseId,
  eventCollectionId,
  studentCollectionId,
  staffFacultyCollectionId,
  communityCollectionId,
} from "@/lib/appwrite";
import EditEvent from "./EditEventDialog";
import ViewParticipants from "./view-participant-dialog/page";
import ExportEventsButton from "./ExportEvent";
import GenerateReportButton from "./ImportEvent";
import { Query } from "appwrite";
import { ColorfulSpinner } from "@/components/ui/loader";
import { NetworkStatus } from "@/components/ui/network-status";

export default function EventParticipantLog() {
  const [events, setEvents] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [staffFaculty, setStaffFaculty] = useState([]);
  const [community, setCommunity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState(null);
  const [sortCriteria, setSortCriteria] = useState("createdAt");
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
    sex: "",
  });
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [currentAcademicPeriod, setCurrentAcademicPeriod] = useState(null);
  const [networkStatus, setNetworkStatus] = useState({ isOnline: true });

  const getParticipantCounts = useCallback(
    (eventId) => {
      // Filter participants for this event
      const eventParticipants = participants.filter(
        (p) => p.eventId === eventId
      );

      // Filter staff/faculty for this event
      const eventStaffFaculty = staffFaculty.filter(
        (p) => p.eventId === eventId
      );

      // Filter community members for this event
      const eventCommunity = community.filter((p) => p.eventId === eventId);

      // Calculate gender counts across all participant types
      const allParticipants = [
        ...eventParticipants,
        ...eventStaffFaculty,
        ...eventCommunity,
      ];

      const maleCount = allParticipants.filter(
        (p) => p.sex?.toLowerCase() === "male"
      ).length;

      const femaleCount = allParticipants.filter(
        (p) => p.sex?.toLowerCase() === "female"
      ).length;

      return {
        total: allParticipants.length,
        male: maleCount,
        female: femaleCount,
        participants: eventParticipants.length,
        staffFaculty: eventStaffFaculty.length,
        community: eventCommunity.length,
      };
    },
    [participants, staffFaculty, community]
  );

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
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
  }, [events, searchTerm, statusFilter]);

  const sortedEvents = useMemo(() => {
    return [...filteredEvents].sort((a, b) => {
      switch (sortCriteria) {
        case "eventDate":
          return new Date(b.eventDate) - new Date(a.eventDate);
        case "eventName":
          return a.eventName.localeCompare(b.eventName);
        case "participantCount":
          return (
            getParticipantCounts(b.$id).total -
            getParticipantCounts(a.$id).total
          );
        default: // "createdAt"
          return new Date(b.$createdAt) - new Date(a.$createdAt);
      }
    });
  }, [filteredEvents, sortCriteria, getParticipantCounts]);

  const formatDateTimeForDisplay = useCallback((dateString) => {
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const user = await getCurrentUser();
      setCurrentUser(user);

      // Get current academic period
      const currentPeriod = await getCurrentAcademicPeriod();
      setCurrentAcademicPeriod(currentPeriod);

      if (!currentPeriod) {
        throw new Error("No active academic period found");
      }

      // Fetch events
      const eventsResponse = await databases.listDocuments(
        databaseId,
        eventCollectionId,
        [
          Query.equal("createdBy", user.$id),
          Query.equal("isArchived", false),
          Query.equal("academicPeriodId", currentPeriod.$id),
          Query.orderDesc("$createdAt"),
        ]
      );

      if (eventsResponse.documents.length === 0) {
        setEvents([]);
        setParticipants([]);
        setStaffFaculty([]);
        setCommunity([]);
        return;
      }

      // Get all event IDs
      const eventIds = eventsResponse.documents.map((event) => event.$id);

      // Fetch participants for all events
      const [studentsResponse, staffFacultyResponse, communityResponse] =
        await Promise.all([
          databases.listDocuments(databaseId, studentCollectionId, [
            Query.equal("eventId", eventIds),
            Query.equal("isArchived", false),
            Query.equal("createdBy", user.$id),
          ]),
          databases.listDocuments(databaseId, staffFacultyCollectionId, [
            Query.equal("eventId", eventIds),
            Query.equal("isArchived", false),
            Query.equal("createdBy", user.$id),
          ]),
          databases.listDocuments(databaseId, communityCollectionId, [
            Query.equal("eventId", eventIds),
            Query.equal("isArchived", false),
            Query.equal("createdBy", user.$id),
          ]),
        ]);

      // Set the state with the fetched data
      setEvents(eventsResponse.documents);
      setParticipants(studentsResponse.documents);
      setStaffFaculty(staffFacultyResponse.documents);
      setCommunity(communityResponse.documents);
    } catch (err) {
      setError("Failed to fetch data. Please try again.");
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
    return (
      <div className="flex items-center justify-center p-8">
        <ColorfulSpinner />
      </div>
    );
  }

  if (!networkStatus.isOnline) {
    return (
      <NetworkStatus
        title="No Internet Connection"
        message="Please check your internet connection to view event logs."
        onRetry={() => window.location.reload()}
        isOffline={true}
      />
    );
  }

  if (error) {
    return (
      <NetworkStatus
        title="Connection Error"
        message={error}
        onRetry={() => fetchData()}
        isOffline={false}
      />
    );
  }

  if (!currentAcademicPeriod?.isActive) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Event Participant Log</CardTitle>
          <CardDescription>View and manage event participants</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">
                No Active Academic Period
              </h3>
              <p className="text-muted-foreground">
                Event participant log will be available once an administrator
                sets up the current academic period.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

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
      events.some(
        (e) =>
          e.$id === newParticipant.eventId &&
          e.participants.some((p) => p.studentId === newParticipant.studentId)
      )
    ) {
      toast.error(
        "This participant is already registered for the selected event"
      );
      return;
    }
    try {
      const updatedEvent = await updateEvent(newParticipant.eventId, {
        ...events.find((e) => e.$id === newParticipant.eventId),
        participants: [
          ...events.find((e) => e.$id === newParticipant.eventId).participants,
          {
            ...newParticipant,
            sex: newParticipant.sex,
            createdBy: currentUser.id,
          },
        ],
        updatedBy: currentUser.id,
      });
      setEvents((prevEvents) =>
        prevEvents.map((event) =>
          event.$id === updatedEvent.$id ? updatedEvent : event
        )
      );
      setNewParticipant({ name: "", studentId: "", eventId: "", sex: "" });
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
      const updatedEvent = await updateEvent(selectedEvent.$id, {
        ...selectedEvent,
        participants: selectedEvent.participants.map((p) =>
          p.$id === editingParticipant.$id ? editingParticipant : p
        ),
        updatedBy: currentUser.id,
      });
      setEvents((prevEvents) =>
        prevEvents.map((event) =>
          event.$id === updatedEvent.$id ? updatedEvent : event
        )
      );
      setSelectedEvent(null);
      setShowParticipants(false);
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
        const updatedEvent = await updateEvent(selectedEvent.$id, {
          ...selectedEvent,
          participants: selectedEvent.participants.filter(
            (p) => p.$id !== participantId
          ),
          updatedBy: currentUser.id,
        });
        setEvents((prevEvents) =>
          prevEvents.map((event) =>
            event.$id === updatedEvent.$id ? updatedEvent : event
          )
        );
        setSelectedEvent(null);
        setShowParticipants(false);
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

  const handleImportSuccess = (importedEvent) => {
    // Refresh the events list
    fetchData();
  };

  const handleViewParticipants = (event) => {
    setSelectedEvent(event);
    setIsViewDialogOpen(true);
  };

  const handleEditParticipant = async (editedParticipant) => {
    if (!currentUser) return;

    try {
      // Update the participant in the database
      const response = await databases.updateDocument(
        databaseId,
        studentCollectionId,
        editedParticipant.$id,
        editedParticipant
      );

      // Update local state
      setParticipants((prevParticipants) =>
        prevParticipants.map((p) =>
          p.$id === editedParticipant.$id ? response : p
        )
      );

      toast.success("Participant updated successfully");
    } catch (error) {
      console.error("Error updating participant:", error);
      toast.error("Failed to update participant");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Event Participant Log</CardTitle>
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
                className="w-full sm:w-64"
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <ExportEventsButton />
              <GenerateReportButton onSuccess={handleImportSuccess} />
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
                  <TableHead className="text-center">Source</TableHead>
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
                        <div className="space-y-1">
                          <div className="font-medium">
                            Total: {participantCounts.total}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Male: {participantCounts.male} | Female:{" "}
                            {participantCounts.female}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            <div>
                              Students: {participantCounts.participants}
                            </div>
                            <div>
                              Staff/Faculty: {participantCounts.staffFaculty}
                            </div>
                            <div>Community: {participantCounts.community}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            event.source === "imported"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-green-100 text-green-800"
                          }`}
                        >
                          {event.source || "created"}
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
          selectedEvent={selectedEvent}
          onEditParticipant={handleEditParticipant}
          onDeleteParticipant={handleDeleteParticipant}
          onAddParticipant={handleAddParticipant}
        />
      )}

      <ViewParticipants
        isOpen={isViewDialogOpen}
        onClose={() => setIsViewDialogOpen(false)}
        selectedEvent={selectedEvent}
        onEditParticipant={handleEditParticipant}
        onDeleteParticipant={handleDeleteParticipant}
        onAddParticipant={handleAddParticipant}
      />
    </Card>
  );
}
