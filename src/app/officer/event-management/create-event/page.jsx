import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { toast } from "react-toastify";
import { Loader2, CalendarIcon } from "lucide-react";
import {
  format,
  parse,
  differenceInHours,
  differenceInMinutes,
  isBefore,
} from "date-fns";
import { cn } from "@/lib/utils";
import {
  createEvent,
  checkDuplicateEvent,
  checkTimeConflict,
} from "@/lib/appwrite";
import { schoolOptions } from "@/utils/participantUtils";

export default function CreateEvent({
  events,
  setEvents,
  setCurrentEventId,
  setActiveSection,
}) {
  const [eventName, setEventName] = useState("");
  const [eventDate, setEventDate] = useState(null);
  const [eventTimeFrom, setEventTimeFrom] = useState("");
  const [eventTimeTo, setEventTimeTo] = useState("");
  const [eventVenue, setEventVenue] = useState("");
  const [eventType, setEventType] = useState("");
  const [eventCategory, setEventCategory] = useState("");
  const [duration, setDuration] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [isTimeValid, setIsTimeValid] = useState(true);

  const [participants, setParticipants] = useState([]);
  const [participantName, setParticipantName] = useState("");
  const [eventCreated, setEventCreated] = useState(false); // This tracks whether the event is created

  useEffect(() => {
    if (eventTimeFrom && eventTimeTo) {
      const start = parse(eventTimeFrom, "HH:mm", new Date());
      const end = parse(eventTimeTo, "HH:mm", new Date());

      if (isBefore(end, start)) {
        setIsTimeValid(false);
        setDuration("");
        toast.warning("End time cannot be earlier than start time.");
      } else {
        setIsTimeValid(true);
        const hours = Math.floor((end - start) / (1000 * 60 * 60));
        const minutes = Math.floor(((end - start) / (1000 * 60)) % 60);
        setDuration(`${hours} hours ${minutes} minutes`);
      }
    }
  }, [eventTimeFrom, eventTimeTo]);

  const capitalizeWords = (input) => {
    return input.replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const validateEventForm = () => {
    const newErrors = {};
    if (!eventDate) newErrors.eventDate = "Event date is required";
    if (!eventName.trim()) newErrors.eventName = "Event name is required";
    if (!eventTimeFrom) newErrors.eventTimeFrom = "Start time is required";
    if (!eventTimeTo) newErrors.eventTimeTo = "End time is required";
    if (!eventVenue.trim()) newErrors.eventVenue = "Venue is required";
    if (!eventType) newErrors.eventType = "Event type is required";
    if (!eventCategory) newErrors.eventCategory = "Category is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    if (!validateEventForm()) return;

    // Check for duplicate event on the frontend
    if (
      events.some(
        (event) =>
          event.name && event.name.toLowerCase() === eventName.toLowerCase()
      )
    ) {
      toast.error(
        "An event with this name already exists. Please choose a unique name."
      );
      return;
    }

    setLoading(true);
    try {
      // Format the event date
      const formattedDate = format(eventDate, "yyyy-MM-dd");

      // Check for duplicate event using the backend
      const isDuplicate = await checkDuplicateEvent(
        eventName,
        formattedDate,
        eventVenue
      );
      if (isDuplicate) {
        toast.error(
          "An event with the same name, date, and venue already exists."
        );
        setLoading(false);
        return;
      }

      // Check for time conflict using the backend
      const hasTimeConflict = await checkTimeConflict(
        formattedDate,
        eventVenue,
        eventTimeFrom,
        eventTimeTo
      );
      if (hasTimeConflict) {
        toast.error("Time conflict detected with another event at this venue.");
        setLoading(false);
        return;
      }

      // Create the new event object
      const newEvent = {
        eventName,
        eventDate: formattedDate,
        eventTimeFrom,
        eventTimeTo,
        eventVenue,
        eventType,
        eventCategory,
        numberOfHours: parseFloat(duration.split(" ")[0]), // Extract hours from the duration
        participants: participants || [], // Ensure participants is an array
        approvalStatus: "pending",
      };

      const createdEvent = await createEvent(newEvent);
      setEvents([...events, createdEvent]);
      setCurrentEventId(createdEvent.$id);
      toast.success(
        "Event created successfully. You can now add participants."
      );
      setActiveSection("participants");

      // Reset form fields
      setEventName("");
      setEventDate(null);
      setEventTimeFrom("");
      setEventTimeTo("");
      setEventVenue("");
      setEventType("");
      setEventCategory("");
      setDuration("");
    } catch (error) {
      console.error("Error creating event: ", error);
      toast.error("Error creating event. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create New Event</CardTitle>
        <CardDescription>Enter the details for your new event.</CardDescription>
      </CardHeader>
      <form onSubmit={handleCreateEvent}>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="eventName">Event Name</Label>
              <Input
                id="eventName"
                value={eventName}
                onChange={(e) => setEventName(capitalizeWords(e.target.value))}
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
                      !eventDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {eventDate ? (
                      format(eventDate, "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={eventDate}
                    onSelect={setEventDate}
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
                value={eventTimeFrom}
                onChange={(e) => setEventTimeFrom(e.target.value)}
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
                value={eventTimeTo}
                onChange={(e) => setEventTimeTo(e.target.value)}
              />
              {errors.eventTimeTo && (
                <p className="text-sm text-red-500">{errors.eventTimeTo}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="eventVenue">Venue</Label>
              <Input
                id="eventVenue"
                value={eventVenue}
                onChange={(e) => setEventVenue(capitalizeWords(e.target.value))}
                placeholder="Enter event venue"
              />
              {errors.eventVenue && (
                <p className="text-sm text-red-500">{errors.eventVenue}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="eventType">Event Type</Label>
              <Select onValueChange={setEventType}>
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
              <Select onValueChange={setEventCategory} disabled={!eventType}>
                <SelectTrigger id="eventCategory">
                  <SelectValue
                    placeholder={
                      eventType ? "Select category" : "Select event type first"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {eventType === "Academic" &&
                    schoolOptions.map((school) => (
                      <SelectItem key={school.abbr} value={school.name}>
                        {school.name}
                      </SelectItem>
                    ))}
                  {eventType === "Non-Academic" &&
                    [
                      "Student Organizations",
                      "Sports",
                      "Cultural",
                      "Community Service",
                      "Career Development",
                      "Other",
                    ].map((category) => (
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
                className={isTimeValid ? "" : "border-red-500"}
              />
              {!isTimeValid && (
                <p className="text-sm text-red-500">
                  Invalid duration. Fix the time range.
                </p>
              )}
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button
            type="submit"
            className="w-full"
            disabled={loading || !isTimeValid}
          >
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              "Create Event"
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
