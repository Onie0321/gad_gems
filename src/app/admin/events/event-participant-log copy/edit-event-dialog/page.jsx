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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
} from "../../../../../utils/eventUtils";
import {
  schoolOptions,
  capitalizeWords,
} from "../../../../../utils/participantUtils";
import { editEvent, updateEvent } from "@/lib/appwrite";

const EditEvent = ({ event, onUpdateEvent }) => {
  const [editingEvent, setEditingEvent] = useState(() => ({
    eventTimeFrom: event?.eventTimeFrom || null,
    eventTimeTo: event?.eventTimeTo || null,
    duration: event?.duration || "",
    ...event,
  }));

  const [duration, setDuration] = useState("");
  const [errors, setErrors] = useState({});
  const [isTimeValid, setIsTimeValid] = useState(true);
  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [updatedEventDetails, setUpdatedEventDetails] = useState(null);

  useEffect(() => {
    if (!isDialogOpen) {
      return; // Skip validation if dialog is not open
    }

    if (!editingEvent.eventTimeFrom || !editingEvent.eventTimeTo) {
      setDuration("");
      setIsTimeValid(true); // Assume valid if times are not yet set
      return;
    }

    const start = new Date(editingEvent.eventTimeFrom);
    const end = new Date(editingEvent.eventTimeTo);

    // Ensure valid date objects
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      setDuration("");
      setIsTimeValid(true); // Avoid triggering warnings on invalid dates
      return;
    }

    // Compare times and set state
    if (isBefore(end, start)) {
      if (isTimeValid) {
        // Only warn once to prevent repeated warnings
        toast.warning("End time cannot be earlier than start time.");
      }
      setIsTimeValid(false);
      setDuration("");
    } else {
      setIsTimeValid(true);
      const hours = Math.floor((end - start) / (1000 * 60 * 60));
      const minutes = Math.floor(((end - start) / (1000 * 60)) % 60);
      setDuration(`${hours} hours ${minutes} minutes`);
    }
  }, [
    editingEvent.eventTimeFrom,
    editingEvent.eventTimeTo,
    isDialogOpen,
    isTimeValid,
  ]);

  const handleSave = async () => {
    if (!validateEventForm(editingEvent)) {
      toast.error("Please fill out all required fields.");
      return;
    }

    setLoading(true);
    try {
      const updatedEvent = {
        eventName: editingEvent.eventName,
        eventDate: editingEvent.eventDate,
        eventTimeFrom: editingEvent.eventTimeFrom,
        eventTimeTo: editingEvent.eventTimeTo,
        eventVenue: editingEvent.eventVenue,
        eventType: editingEvent.eventType,
        eventCategory: editingEvent.eventCategory,
        numberOfHours: duration.split(" ")[0].toString(),
      };

      const response = await editEvent(editingEvent.$id, updatedEvent);

      // Store updated event details for success modal
      setUpdatedEventDetails({
        ...response,
        formattedDate: format(new Date(response.eventDate), "MMMM d, yyyy"),
        formattedTimeFrom: format(new Date(response.eventTimeFrom), "h:mm a"),
        formattedTimeTo: format(new Date(response.eventTimeTo), "h:mm a"),
      });

      // Update parent component
      onUpdateEvent(response);

      // Show success dialog instead of toast
      setShowSuccessDialog(true);
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Error updating event:", error);
      toast.error("Error updating event.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsDialogOpen(true)}
          >
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
                  value={
                    editingEvent.eventTimeFrom
                      ? new Date(editingEvent.eventTimeFrom)
                          .toISOString()
                          .substring(11, 16)
                      : ""
                  }
                  onChange={(e) =>
                    setEditingEvent({
                      ...editingEvent,
                      eventTimeFrom: `${editingEvent.eventDate}T${e.target.value}:00.000Z`,
                    })
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
                  value={
                    editingEvent.eventTimeTo
                      ? new Date(editingEvent.eventTimeTo)
                          .toISOString()
                          .substring(11, 16)
                      : ""
                  }
                  onChange={(e) =>
                    setEditingEvent({
                      ...editingEvent,
                      eventTimeTo: `${editingEvent.eventDate}T${e.target.value}:00.000Z`,
                    })
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

      <AlertDialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <AlertDialogContent className="max-w-[500px]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-green-600">
              Event Updated Successfully
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-4">
              {updatedEventDetails && (
                <div className="mt-4 space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="space-y-2">
                      <p className="font-semibold">Event Name:</p>
                      <p className="text-gray-600">
                        {updatedEventDetails.eventName}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <p className="font-semibold">Date:</p>
                      <p className="text-gray-600">
                        {updatedEventDetails.formattedDate}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <p className="font-semibold">Time:</p>
                      <p className="text-gray-600">
                        {updatedEventDetails.formattedTimeFrom} -{" "}
                        {updatedEventDetails.formattedTimeTo}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <p className="font-semibold">Venue:</p>
                      <p className="text-gray-600">
                        {updatedEventDetails.eventVenue}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <p className="font-semibold">Type:</p>
                      <p className="text-gray-600">
                        {updatedEventDetails.eventType}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <p className="font-semibold">Category:</p>
                      <p className="text-gray-600">
                        {updatedEventDetails.eventCategory}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <p className="font-semibold">Duration:</p>
                      <p className="text-gray-600">
                        {updatedEventDetails.numberOfHours} hours
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 mt-4">
                    The event details have been successfully updated in the
                    system.
                  </p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction
              className="bg-green-600 hover:bg-green-700 text-white"
              onClick={() => setShowSuccessDialog(false)}
            >
              Close
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default EditEvent;
