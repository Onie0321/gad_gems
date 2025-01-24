"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Users } from "lucide-react";
import { toast } from "react-toastify";
import {
  getEvents,
  getParticipants,
  getStaffFaculty,
  getCommunityMembers,
} from "@/lib/appwrite";
import { exportEventsToExcel } from "@/utils/exportUtils";

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const formatTime = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const calculateDuration = (timeFrom, timeTo) => {
  const start = new Date(timeFrom);
  const end = new Date(timeTo);
  const durationMs = end - start;
  const hours = Math.floor(durationMs / (1000 * 60 * 60));
  const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours} hours ${minutes} minutes`;
};

export default function ExportEventsButton() {
  const [events, setEvents] = useState([]);
  const [selectedEvents, setSelectedEvents] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [fileName, setFileName] = useState("events.xlsx");

  const handleDialogOpen = async () => {
    setIsLoading(true);
    try {
      const eventsData = await getEvents();
      setEvents(eventsData);
      setIsDialogOpen(true);
    } catch (error) {
      console.error("Error fetching events:", error);
      toast.error("Failed to fetch events");
    }
    setIsLoading(false);
  };

  const handleSelectEvent = (eventId) => {
    setSelectedEvents((prevSelected) =>
      prevSelected.includes(eventId)
        ? prevSelected.filter((id) => id !== eventId)
        : [...prevSelected, eventId]
    );
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedEvents(events.map((event) => event.$id));
    } else {
      setSelectedEvents([]);
    }
  };

  const handlePreview = async () => {
    setIsLoading(true);
    try {
      const previewData = await generatePreviewData(selectedEvents);
      setPreviewData(previewData);
    } catch (error) {
      console.error("Error generating preview:", error);
      toast.error("Failed to generate preview");
    }
    setIsLoading(false);
  };

  const handleExport = async () => {
    try {
      setIsLoading(true);
      await exportEventsToExcel(selectedEvents, fileName);
      toast.success("Events exported successfully to Excel");
    } catch (error) {
      toast.error("Export failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredEvents = events.filter((event) =>
    event.eventName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <Button variant="outline" onClick={handleDialogOpen} disabled={isLoading}>
        <Users className="mr-2 h-4 w-4" />
        {isLoading ? "Loading..." : "Export Events"}
      </Button>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Export Events</DialogTitle>
            <DialogDescription>
              Select the events you want to export to Excel.
            </DialogDescription>
          </DialogHeader>
          {!previewData ? (
            <>
              <div className="py-4">
                <Label htmlFor="search-events" className="text-right">
                  Search Events
                </Label>
                <Input
                  id="search-events"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search events"
                  className="col-span-3"
                />
              </div>
              <div className="flex items-center space-x-2 py-2">
                <Checkbox
                  id="select-all"
                  checked={selectedEvents.length === events.length}
                  onCheckedChange={handleSelectAll}
                />
                <Label htmlFor="select-all">Select All</Label>
              </div>
              <ScrollArea className="h-[200px] rounded-md border p-4">
                {filteredEvents.map((event) => (
                  <div
                    key={event.$id}
                    className="flex items-center space-x-2 py-2"
                  >
                    <Checkbox
                      id={`event-${event.$id}`}
                      checked={selectedEvents.includes(event.$id)}
                      onCheckedChange={() => handleSelectEvent(event.$id)}
                    />
                    <Label htmlFor={`event-${event.$id}`}>
                      {event.eventName}
                    </Label>
                  </div>
                ))}
              </ScrollArea>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handlePreview}
                  disabled={isLoading || selectedEvents.length === 0}
                >
                  Preview
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <ScrollArea className="h-[300px] rounded-md border p-4">
                <h3 className="font-bold mb-2">Preview</h3>
                <p className="mb-4">
                  Total Events Selected: {previewData.length}
                </p>
                {previewData.map((event, index) => (
                  <div key={index} className="mb-4 p-4 border rounded-md">
                    <h4  className="font-semibold"><strong>Event Name :</strong>{event.eventName}</h4>
                    <p>
                      <strong>School Year:</strong> {event.schoolYear || "2023-2024"}
                    </p>
                    <p>
                      <strong>Period Type:</strong> {event.periodType || "First Semester"}
                    </p>
                    <p><strong>Date:</strong> {formatDate(event.eventDate)}</p>
                    <p>
                      <strong>Time:</strong> {formatTime(event.eventTimeFrom)} - {formatTime(event.eventTimeTo)}
                    </p>
                    <p><strong>Duration:</strong> {event.duration}</p>
                    <p><strong>Venue:</strong> {event.eventVenue}</p>
                    <p><strong>Event Type:</strong> {event.eventType}</p>
                    <p><strong>Event Category:</strong> {event.eventCategory}</p>
                    <div className="mt-2">
                      <p><strong>Total Participants:</strong> {event.totalParticipants}</p>
                      <p>
                        <strong>Male:</strong> {event.maleParticipants} | <strong>Female:</strong> {event.femaleParticipants}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        <strong>Students:</strong> {event.studentCount} | <strong>Staff/Faculty:</strong> {event.staffFacultyCount} | <strong>Community:</strong> {event.communityCount}
                      </p>
                    </div>
                  </div>
                ))}
              </ScrollArea>
              <div className="py-4">
                <Label htmlFor="file-name" className="text-right">
                  File Name
                </Label>
                <Input
                  id="file-name"
                  value={fileName}
                  onChange={(e) =>
                    setFileName(
                      e.target.value.endsWith(".xlsx")
                        ? e.target.value
                        : `${e.target.value}.xlsx`
                    )
                  }
                  placeholder="Enter file name"
                  className="col-span-3"
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setPreviewData(null)}>
                  Back
                </Button>
                <Button onClick={handleExport} disabled={isLoading}>
                  {isLoading ? "Exporting..." : "Export to Excel"}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

async function generatePreviewData(selectedEventIds) {
  const allEvents = await getEvents();
  const selectedEvents = allEvents.filter((event) =>
    selectedEventIds.includes(event.$id)
  );

  const previewData = await Promise.all(
    selectedEvents.map(async (event) => {
      const [participants, staffFaculty, community] = await Promise.all([
        getParticipants(event.$id),
        getStaffFaculty(event.$id),
        getCommunityMembers(event.$id),
      ]);

      const totalParticipants =
        participants.length + staffFaculty.length + community.length;

      const totalMale = [
        ...participants.filter((p) => p.sex === "Male"),
        ...staffFaculty.filter((p) => p.sex === "Male"),
        ...community.filter((p) => p.sex === "Male"),
      ].length;

      const totalFemale = [
        ...participants.filter((p) => p.sex === "Female"),
        ...staffFaculty.filter((p) => p.sex === "Female"),
        ...community.filter((p) => p.sex === "Female"),
      ].length;

      return {
        eventName: event.eventName,
        eventDate: event.eventDate,
        eventTimeFrom: event.eventTimeFrom,
        eventTimeTo: event.eventTimeTo,
        duration: calculateDuration(event.eventTimeFrom, event.eventTimeTo),
        eventVenue: event.eventVenue,
        eventType: event.eventType,
        eventCategory: event.eventCategory,
        totalParticipants,
        maleParticipants: totalMale,
        femaleParticipants: totalFemale,
        studentCount: participants.length,
        staffFacultyCount: staffFaculty.length,
        communityCount: community.length,
        schoolYear: event.schoolYear || "2023-2024",
        periodType: event.periodType || "First Semester",
      };
    })
  );

  return previewData;
}
