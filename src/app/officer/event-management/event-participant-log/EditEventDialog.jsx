"use client";
import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Loader2, CalendarIcon, Edit } from "lucide-react";
import { toast } from "react-toastify";
import { format, parse, isBefore } from "date-fns";
import { cn } from "@/lib/utils";
import {
  validateEventForm,
  getNonAcademicCategories,
} from "../../../../utils/eventUtils";
import {
  schoolOptions,
  capitalizeWords,
} from "../../../../utils/participantUtils";
import { editEvent } from "@/lib/appwrite";

const EditEvent = ({ event, onUpdateEvent }) => {
  const [editingEvent, setEditingEvent] = useState(() => {
    // Safely parse the dates and times
    let eventTimeFrom = null;
    let eventTimeTo = null;

    if (event?.eventTimeFrom) {
      try {
        const date = new Date(event.eventTimeFrom);
        if (!isNaN(date.getTime())) {
          eventTimeFrom = date;
        }
      } catch (error) {
        console.error("Error parsing eventTimeFrom:", error);
      }
    }

    if (event?.eventTimeTo) {
      try {
        const date = new Date(event.eventTimeTo);
        if (!isNaN(date.getTime())) {
          eventTimeTo = date;
        }
      } catch (error) {
        console.error("Error parsing eventTimeTo:", error);
      }
    }

    return {
      eventTimeFrom,
      eventTimeTo,
      numberOfHours: event?.numberOfHours || 0,
      ...event,
    };
  });

  const [duration, setDuration] = useState("");
  const [errors, setErrors] = useState({});
  const [isTimeValid, setIsTimeValid] = useState(true);
  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const calculateDuration = (startTime, endTime) => {
    if (!startTime || !endTime) return "";

    try {
      const start = new Date(`1970-01-01T${startTime}`);
      const end = new Date(`1970-01-01T${endTime}`);

      // Handle case where end time is on the next day
      if (end < start) {
        end.setDate(end.getDate() + 1);
      }

      const diffInMinutes = (end - start) / (1000 * 60);
      const hours = Math.floor(diffInMinutes / 60);
      const minutes = Math.floor(diffInMinutes % 60);

      return `${hours} hours ${minutes} minutes`;
    } catch (error) {
      console.error("Error calculating duration:", error);
      return "";
    }
  };

  useEffect(() => {
    if (!isDialogOpen) {
      return;
    }

    if (!editingEvent.eventTimeFrom || !editingEvent.eventTimeTo) {
      setDuration(duration || "");
      setIsTimeValid(true);
      return;
    }

    try {
      const start = new Date(editingEvent.eventTimeFrom);
      const end = new Date(editingEvent.eventTimeTo);

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        setIsTimeValid(false);
        setDuration("");
        return;
      }

      const startTime = start.toTimeString().slice(0, 5);
      const endTime = end.toTimeString().slice(0, 5);
      const calculatedDuration = calculateDuration(startTime, endTime);

      if (calculatedDuration) {
        setIsTimeValid(true);
        setDuration(calculatedDuration);
        const [hours, minutes] = calculatedDuration.match(/\d+/g).map(Number);
        setEditingEvent((prev) => ({
          ...prev,
          numberOfHours: hours + minutes / 60,
        }));
      } else {
        setIsTimeValid(false);
        setDuration("");
        if (isTimeValid) {
          toast.warning("Invalid time range");
        }
      }
    } catch (error) {
      console.error("Error processing time:", error);
      setIsTimeValid(false);
      setDuration("");
    }
  }, [
    editingEvent.eventTimeFrom,
    editingEvent.eventTimeTo,
    isDialogOpen,
    isTimeValid,
    duration,
  ]);

  const formatTimeForInput = (date) => {
    if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
      return "";
    }
    // Format time as HH:mm
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    return `${hours}:${minutes}`;
  };

  const handleTimeChange = (field, value) => {
    if (!editingEvent.eventDate) {
      toast.warning("Please select a date first");
      return;
    }

    try {
      // Parse the time value (HH:mm format)
      const [hours, minutes] = value.split(":").map(Number);
      if (isNaN(hours) || isNaN(minutes)) {
        throw new Error("Invalid time format");
      }

      // Create a new date using the event date and the new time
      const newDate = new Date(editingEvent.eventDate);
      newDate.setHours(hours, minutes, 0, 0);

      if (isNaN(newDate.getTime())) {
        throw new Error("Invalid date");
      }

      setEditingEvent((prev) => ({
        ...prev,
        [field]: newDate,
      }));
    } catch (error) {
      console.error("Error setting time:", error);
      toast.error("Invalid time format");
    }
  };

  const handleSave = async () => {
    if (!validateEventForm(editingEvent)) {
      toast.error("Please fill out all required fields.");
      return;
    }

    setLoading(true);
    try {
      // Clean the event object by only including the fields we want to update
      const updatedEvent = {
        eventName: editingEvent.eventName,
        eventDate: editingEvent.eventDate,
        eventTimeFrom: editingEvent.eventTimeFrom,
        eventTimeTo: editingEvent.eventTimeTo,
        eventVenue: editingEvent.eventVenue,
        eventType: editingEvent.eventType,
        eventCategory: editingEvent.eventCategory,
        numberOfHours: editingEvent.numberOfHours,
        isArchived: editingEvent.isArchived || false,
        academicPeriodId: editingEvent.academicPeriodId,
        createdBy: editingEvent.createdBy,
        source: editingEvent.source || "created",
      };

      // Remove any undefined or null values
      Object.keys(updatedEvent).forEach((key) => {
        if (updatedEvent[key] === undefined || updatedEvent[key] === null) {
          delete updatedEvent[key];
        }
      });

      // Update the event in the database
      const response = await editEvent(editingEvent.$id, updatedEvent);

      // Update the parent component or state with the updated event
      onUpdateEvent(response);

      toast.success("Event updated successfully.");
      setIsDialogOpen(false); // Close dialog on success
    } catch (error) {
      toast.error("Failed to update event.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" onClick={() => setIsDialogOpen(true)}>
          <Edit className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Event</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="eventName">Event Name</Label>
              <Input
                id="eventName"
                value={editingEvent.eventName}
                onChange={(e) =>
                  setEditingEvent({
                    ...editingEvent,
                    eventName: e.target.value,
                  })
                }
                placeholder="Enter event name"
              />
              {errors.eventName && (
                <p className="text-sm text-red-500">{errors.eventName}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="eventDate">Event Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !editingEvent.eventDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {editingEvent.eventDate
                      ? format(new Date(editingEvent.eventDate), "PPP")
                      : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={new Date(editingEvent.eventDate)}
                    onSelect={(date) =>
                      setEditingEvent({
                        ...editingEvent,
                        eventDate: format(date, "yyyy-MM-dd"),
                      })
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {errors.eventDate && (
                <p className="text-sm text-red-500">{errors.eventDate}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="eventTimeFrom">Start Time</Label>
              <Input
                id="eventTimeFrom"
                type="time"
                value={formatTimeForInput(editingEvent.eventTimeFrom)}
                onChange={(e) =>
                  handleTimeChange("eventTimeFrom", e.target.value)
                }
              />
              {errors.eventTimeFrom && (
                <p className="text-sm text-red-500">{errors.eventTimeFrom}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="eventTimeTo">End Time</Label>
              <Input
                id="eventTimeTo"
                type="time"
                value={formatTimeForInput(editingEvent.eventTimeTo)}
                onChange={(e) =>
                  handleTimeChange("eventTimeTo", e.target.value)
                }
              />
              {errors.eventTimeTo && (
                <p className="text-sm text-red-500">{errors.eventTimeTo}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="eventVenue">Venue</Label>
              <Input
                id="eventVenue"
                value={editingEvent.eventVenue}
                onChange={(e) =>
                  setEditingEvent({
                    ...editingEvent,
                    eventVenue: e.target.value,
                  })
                }
                placeholder="Enter event venue"
              />
              {errors.eventVenue && (
                <p className="text-sm text-red-500">{errors.eventVenue}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="eventType">Event Type</Label>
              <Select
                onValueChange={(value) =>
                  setEditingEvent({ ...editingEvent, eventType: value })
                }
                value={editingEvent.eventType}
              >
                <SelectTrigger id="eventType">
                  <SelectValue placeholder="Select event type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Academic">Academic</SelectItem>
                  <SelectItem value="Non-Academic">Non-Academic</SelectItem>
                </SelectContent>
              </Select>
              {errors.eventType && (
                <p className="text-sm text-red-500">{errors.eventType}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="eventCategory">Event Category</Label>
              <Select
                onValueChange={(value) =>
                  setEditingEvent({ ...editingEvent, eventCategory: value })
                }
                value={editingEvent.eventCategory}
                disabled={!editingEvent.eventType}
              >
                <SelectTrigger id="eventCategory">
                  <SelectValue
                    placeholder={
                      editingEvent.eventType
                        ? "Select category"
                        : "Select event type first"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {editingEvent.eventType === "Academic" &&
                    schoolOptions.map((school) => (
                      <SelectItem key={school.abbr} value={school.name}>
                        {school.name}
                      </SelectItem>
                    ))}
                  {editingEvent.eventType === "Non-Academic" &&
                    getNonAcademicCategories().map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              {errors.eventCategory && (
                <p className="text-sm text-red-500">{errors.eventCategory}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="duration">Duration</Label>
              <Input
                id="duration"
                value={duration}
                readOnly
                disabled
                className={isTimeValid ? "" : "border-red-500"}
              />
              {!isTimeValid && (
                <p className="text-sm text-red-500">
                  Invalid duration. Fix the time range.
                </p>
              )}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSave} disabled={loading || !isTimeValid}>
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              "Save Changes"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditEvent;
