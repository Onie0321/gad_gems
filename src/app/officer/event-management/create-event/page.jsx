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
import { Loader2, CalendarIcon, ChevronDown } from "lucide-react";
import {
  format,
  parse,
  isBefore,
  isSameDay,
  differenceInDays,
  isValid,
} from "date-fns";
import { cn } from "@/lib/utils";
import {
  createEvent,
  checkDuplicateEvent,
  checkTimeConflict,
  createNotification,
  notifyEventCreation,
  databases,
  databaseId,
  eventCollectionId,

} from "@/lib/appwrite";
import { schoolOptions, getNonAcademicCategories } from "@/utils/eventUtils";
import { useTabContext } from "@/context/TabContext"; // Import the context hook
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { DateRange } from "react-day-picker";
import { addDays, isWeekend, isWithinInterval } from "date-fns";
import { philippineHolidays } from "@/utils/eventUtils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ID } from "appwrite";

export default function CreateEvent({ onEventCreated, user }) {
  const [eventName, setEventName] = useState("");
  const [eventDate, setEventDate] = useState(null);
  const [eventTimeFrom, setEventTimeFrom] = useState("");
  const [eventTimeTo, setEventTimeTo] = useState("");
  const [eventVenue, setEventVenue] = useState("");
  const [eventType, setEventType] = useState([]);
  const [eventCategory, setEventCategory] = useState("");
  const [duration, setDuration] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [isTimeValid, setIsTimeValid] = useState(true);
  const { setActiveTab } = useTabContext();
  const [tempTimeFrom, setTempTimeFrom] = useState("");
  const [tempTimeTo, setTempTimeTo] = useState("");
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [tempSelectedCategories, setTempSelectedCategories] = useState([]);
  const [showTimeFromDialog, setShowTimeFromDialog] = useState(false);
  const [showTimeToDialog, setShowTimeToDialog] = useState(false);
  const [selectedDates, setSelectedDates] = useState([]);
  const [dateRanges, setDateRanges] = useState([]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [currentRange, setCurrentRange] = useState({
    from: undefined,
    to: undefined,
  });
  const [excludeWeekends, setExcludeWeekends] = useState(false);
  const [excludeHolidays, setExcludeHolidays] = useState(false);
  const [showWarningDialog, setShowWarningDialog] = useState(false);
  const [pendingDate, setPendingDate] = useState(null);
  const [pendingRange, setPendingRange] = useState(null);
  const [warningType, setWarningType] = useState(""); // 'weekend' or 'holiday'
  const [pendingHolidayName, setPendingHolidayName] = useState("");
  const [isRangePopoverOpen, setIsRangePopoverOpen] = useState(false);
  const [selectAllNonAcademic, setSelectAllNonAcademic] = useState(false);
  const [selectAllAcademic, setSelectAllAcademic] = useState(false);

  const academicCategories = schoolOptions.map((school) => school.name);
  const nonAcademicCategories = getNonAcademicCategories();

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
        const hours = Math.floor(
          (end.getTime() - start.getTime()) / (1000 * 60 * 60)
        );
        const minutes = Math.floor(
          ((end.getTime() - start.getTime()) / (1000 * 60)) % 60
        );
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
    if (eventType.length === 0)
      newErrors.eventType = "At least one event type is required";
    if (selectedCategories.length === 0)
      newErrors.eventCategory = "At least one category must be selected";
    if (selectedDates.length === 0 && dateRanges.length === 0) {
      newErrors.eventDate = "At least one event date must be selected";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Utility function to check if two dates are on the same day
  const isSameDay = (first, second) =>
    first.getFullYear() === second.getFullYear() &&
    first.getMonth() === second.getMonth() &&
    first.getDate() === second.getDate();

  // Main function to handle event creation
  const handleCreateEvent = async (e) => {
    e.preventDefault();

    if (!validateEventForm()) return;

    if (!user || !user.$id) {
      toast.error("User not authenticated. Please log in and try again.");
      return;
    }

    setLoading(true);
    try {
      // Format dates as ISO datetime strings
      const formattedDates = selectedDates.map(date => 
        new Date(date).toISOString()
      );

      const formattedDateRanges = dateRanges.map(range => ({
        from: new Date(range.from).toISOString(),
        to: new Date(range.to).toISOString()
      }));

      // Use the first date for conflict checking
      const primaryDate = formattedDates[0] || formattedDateRanges[0]?.from;

      // Check for duplicate events
      const isDuplicate = await checkDuplicateEvent(
        eventName,
        primaryDate,
        eventVenue
      );
      if (isDuplicate) {
        toast.error("An event with the same name, date, and venue already exists.");
        setLoading(false);
        return;
      }

      // Check for time conflicts
      const hasTimeConflict = await checkTimeConflict(
        primaryDate,
        eventVenue,
        eventTimeFrom,
        eventTimeTo
      );
      if (hasTimeConflict) {
        toast.error("There is already an event scheduled at this venue during the selected time.");
        setLoading(false);
        return;
      }

      // Create separate events for each date
      const createdEvents = await Promise.all(
        formattedDates.map(async (date) => {
          // Combine date with time
          const startDateTime = new Date(date);
          const [hours, minutes] = eventTimeFrom.split(':');
          startDateTime.setHours(parseInt(hours), parseInt(minutes), 0);

          const endDateTime = new Date(date);
          const [endHours, endMinutes] = eventTimeTo.split(':');
          endDateTime.setHours(parseInt(endHours), parseInt(endMinutes), 0);

          const eventData = {
            eventName,
            eventDate: startDateTime.toISOString(), // Single datetime value
            eventTimeFrom: startDateTime.toISOString(), // Full datetime for start
            eventTimeTo: endDateTime.toISOString(), // Full datetime for end
            eventVenue,
            eventType: eventType[0], // Since eventType is a string in schema
            eventCategory,
            numberOfHours: duration,
            participants: [],
            createdBy: user.$id
          };

          return await databases.createDocument(
            databaseId,
            eventCollectionId,
            ID.unique(),
            eventData
          );
        })
      );

      // Also create events for date ranges
      for (const range of dateRanges) {
        const start = new Date(range.from);
        const end = new Date(range.to);
        
        for (let date = start; date <= end; date.setDate(date.getDate() + 1)) {
          if (
            (!excludeWeekends || !isWeekend(date)) && 
            (!excludeHolidays || !isPhilippineHoliday(date))
          ) {
            const startDateTime = new Date(date);
            const [hours, minutes] = eventTimeFrom.split(':');
            startDateTime.setHours(parseInt(hours), parseInt(minutes), 0);

            const endDateTime = new Date(date);
            const [endHours, endMinutes] = eventTimeTo.split(':');
            endDateTime.setHours(parseInt(endHours), parseInt(endMinutes), 0);

            const eventData = {
              eventName,
              eventDate: startDateTime.toISOString(),
              eventTimeFrom: startDateTime.toISOString(),
              eventTimeTo: endDateTime.toISOString(),
              eventVenue,
              eventType: eventType[0],
              eventCategory,
              numberOfHours: duration,
              participants: [],
              createdBy: user.$id
            };

            createdEvents.push(
              await databases.createDocument(
                databaseId,
                eventCollectionId,
                ID.unique(),
                eventData
              )
            );
          }
        }
      }

      // Create notification for the event(s)
      await createNotification({
        userId: user.$id,
        type: "event",
        title: "Event(s) Created Successfully",
        message: `Your event "${eventName}" has been created successfully for ${createdEvents.length} date(s).`,
        actionType: "event_created",
        approvalStatus: "approved",
        read: false,
      });

      toast.success(`Successfully created ${createdEvents.length} event(s)! Add participants now.`);

      // Reset form fields
      setEventName("");
      setEventDate([]);
      setEventTimeFrom("");
      setEventTimeTo("");
      setEventVenue("");
      setEventType([]);
      setEventCategory("");
      setDuration("");
      setSelectedDates([]);
      setDateRanges([]);

      // Navigate to participant management tab for the first created event
      if (onEventCreated && createdEvents.length > 0) {
        onEventCreated(createdEvents[0].$id);
      }
      setActiveTab("participants");

    } catch (error) {
      console.error("Error creating event: ", error);
      toast.error(
        error instanceof Error
          ? `Error creating event: ${error.message}`
          : "An unexpected error occurred. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // Date selection handler
  const handleDateSelect = (date) => {
    try {
      if (!date) return;

      const formattedDate = new Date(date);
      if (isNaN(formattedDate.getTime())) {
        throw new Error("Invalid date");
      }

      if (selectedDates.some((d) => isSameDay(new Date(d), formattedDate))) {
        setSelectedDates(
          selectedDates.filter((d) => !isSameDay(new Date(d), formattedDate))
        );
      } else {
        setSelectedDates([...selectedDates, formattedDate]);
      }
    } catch (error) {
      console.error("Error handling date selection:", error);
      toast({
        title: "Error",
        description: "Invalid date selection",
        variant: "destructive",
      });
    }
  };

  // Range selection handler
  const handleRangeSelect = (range) => {
    try {
      if (!range || !range.from || !range.to) return;

      const formattedFrom = new Date(range.from);
      const formattedTo = new Date(range.to);

      if (isNaN(formattedFrom.getTime()) || isNaN(formattedTo.getTime())) {
        throw new Error("Invalid date range");
      }

      setDateRanges([...dateRanges, { from: formattedFrom, to: formattedTo }]);
    } catch (error) {
      console.error("Error handling range selection:", error);
      toast({
        title: "Error",
        description: "Invalid date range selection",
        variant: "destructive",
      });
    }
  };

  const getTotalDays = () => {
    let total = 0;
    // Count individual dates
    total += selectedDates.length;
    // Count days in ranges
    dateRanges.forEach((range) => {
      const days = differenceInDays(range.to, range.from) + 1;
      total += days;
    });
    return total;
  };

  const checkDateValidity = (date) => {
    if (excludeWeekends && isWeekend(date)) {
      return { isValid: false, type: "weekend" };
    }
    if (
      excludeHolidays &&
      philippineHolidays.some((holiday) => isSameDay(holiday.date, date))
    ) {
      return {
        isValid: false,
        type: "holiday",
        holidayName: philippineHolidays.find((h) => isSameDay(h.date, date))
          .name,
      };
    }
    return { isValid: true };
  };

  const handleSelectAllNonAcademic = (checked) => {
    setSelectAllNonAcademic(checked);
    if (checked) {
      setSelectedCategories(nonAcademicCategories.map((cat) => cat.value));
    } else {
      setSelectedCategories([]);
    }
  };

  const handleSelectAllAcademic = (checked) => {
    setSelectAllAcademic(checked);
    if (checked) {
      setSelectedCategories(academicCategories.map((cat) => cat.value));
    } else {
      setSelectedCategories([]);
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
            <div className="space-y-4">
              <Label>
                Event Date(s){" "}
                {getTotalDays() > 0 && `(${getTotalDays()} days selected)`}
              </Label>

              <Dialog open={showDatePicker} onOpenChange={setShowDatePicker}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-between"
                    role="combobox"
                  >
                    {getTotalDays() > 0
                      ? `${getTotalDays()} days selected`
                      : "Select event dates"}
                    <CalendarIcon className="ml-2 h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-[1000px]">
                  <DialogHeader>
                    <DialogTitle>Select Event Dates</DialogTitle>
                  </DialogHeader>

                  <div className="grid grid-cols-[1fr,400px] gap-6">
                    <div className="space-y-4">
                      <div className="flex items-center space-x-4 mb-4">
                        <Checkbox
                          id="excludeWeekends"
                          checked={excludeWeekends}
                          onCheckedChange={setExcludeWeekends}
                        />
                        <label htmlFor="excludeWeekends">
                          Exclude Weekends
                        </label>

                        <Checkbox
                          id="excludeHolidays"
                          checked={excludeHolidays}
                          onCheckedChange={setExcludeHolidays}
                        />
                        <label htmlFor="excludeHolidays">
                          Exclude Holidays
                        </label>
                      </div>

                      <div className="border rounded-md p-4">
                        <Calendar
                          mode="multiple"
                          selected={selectedDates}
                          onSelect={(dates) => {
                            if (!dates) return;

                            const newDate = dates[dates.length - 1];
                            if (newDate && !selectedDates.includes(newDate)) {
                              const validity = checkDateValidity(newDate);
                              if (!validity.isValid) {
                                setPendingDate({
                                  date: newDate,
                                  action: "add",
                                });
                                setWarningType(validity.type);
                                setShowWarningDialog(true);
                                return;
                              }
                            }
                            setSelectedDates(dates);
                          }}
                          numberOfMonths={2}
                          className="rounded-md"
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Add Date Range</Label>
                        <Popover
                          open={isRangePopoverOpen}
                          onOpenChange={setIsRangePopoverOpen}
                        >
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !currentRange && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {currentRange?.from ? (
                                currentRange.to ? (
                                  <>
                                    {format(currentRange.from, "LLL dd, y")} -{" "}
                                    {format(currentRange.to, "LLL dd, y")}
                                  </>
                                ) : (
                                  format(currentRange.from, "LLL dd, y")
                                )
                              ) : (
                                <span>Pick a date range</span>
                              )}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <div className="border rounded-md p-4">
                              <Calendar
                                initialFocus
                                mode="range"
                                defaultMonth={currentRange?.from}
                                selected={currentRange}
                                onSelect={(range) => {
                                  if (!range) return;

                                  if (range.from) {
                                    const validityFrom = checkDateValidity(
                                      range.from
                                    );
                                    if (!validityFrom.isValid) {
                                      setPendingRange(range);
                                      setWarningType(validityFrom.type);
                                      const holiday = philippineHolidays.find(
                                        (h) => isSameDay(h.date, range.from)
                                      );
                                      setPendingHolidayName(
                                        holiday?.name || ""
                                      );
                                      setShowWarningDialog(true);
                                      return;
                                    }
                                  }
                                  if (range.to) {
                                    const validityTo = checkDateValidity(
                                      range.to
                                    );
                                    if (!validityTo.isValid) {
                                      setPendingRange(range);
                                      setWarningType(validityTo.type);
                                      const holiday = philippineHolidays.find(
                                        (h) => isSameDay(h.date, range.to)
                                      );
                                      setPendingHolidayName(
                                        holiday?.name || ""
                                      );
                                      setShowWarningDialog(true);
                                      return;
                                    }
                                  }
                                  setCurrentRange(range);
                                }}
                                numberOfMonths={2}
                              />
                              <div className="flex justify-end mt-4 space-x-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setCurrentRange({
                                      from: undefined,
                                      to: undefined,
                                    });
                                    setIsRangePopoverOpen(false);
                                  }}
                                >
                                  Cancel
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    if (
                                      currentRange?.from &&
                                      currentRange?.to
                                    ) {
                                      setDateRanges([
                                        ...dateRanges,
                                        currentRange,
                                      ]);
                                      setCurrentRange({
                                        from: undefined,
                                        to: undefined,
                                      });
                                      setIsRangePopoverOpen(false);
                                    }
                                  }}
                                  disabled={
                                    !currentRange?.from || !currentRange?.to
                                  }
                                >
                                  OK
                                </Button>
                              </div>
                            </div>
                          </PopoverContent>
                        </Popover>
                        <Button
                          onClick={() => {
                            if (currentRange?.from && currentRange?.to) {
                              setDateRanges([...dateRanges, currentRange]);
                              setCurrentRange({
                                from: undefined,
                                to: undefined,
                              });
                            }
                          }}
                          disabled={!currentRange?.from || !currentRange?.to}
                          className="w-full mt-2"
                        >
                          Add Range
                        </Button>
                      </div>

                      <div className="space-y-2">
                        <Label>Selected Dates:</Label>
                        <div className="h-[150px] overflow-y-auto space-y-2 border rounded-md p-2 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100">
                          {selectedDates.map((date, index) => (
                            <div
                              key={index}
                              className="flex justify-between items-center p-2 hover:bg-accent rounded-md"
                            >
                              <span>{format(date, "PPP")}</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  setSelectedDates((dates) =>
                                    dates.filter((_, i) => i !== index)
                                  )
                                }
                              >
                                ×
                              </Button>
                            </div>
                          ))}
                          {dateRanges.map((range, index) => (
                            <div
                              key={`range-${index}`}
                              className="flex justify-between items-center p-2 hover:bg-accent rounded-md"
                            >
                              <span>
                                {format(range.from, "PPP")} -{" "}
                                {format(range.to, "PPP")}
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  setDateRanges((ranges) =>
                                    ranges.filter((_, i) => i !== index)
                                  )
                                }
                              >
                                ×
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <DialogFooter className="mt-4">
                    <Button
                      variant="outline"
                      onClick={() => setShowDatePicker(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={() => {
                        setEventDate([...selectedDates, ...dateRanges]);
                        setShowDatePicker(false);
                      }}
                    >
                      OK
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* Warning Dialog */}
              <AlertDialog
                open={showWarningDialog}
                onOpenChange={setShowWarningDialog}
              >
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Warning</AlertDialogTitle>
                    <AlertDialogDescription>
                      {warningType === "weekend"
                        ? "You are attempting to select a weekend date. Do you want to proceed?"
                        : `You are attempting to select a date that falls on ${pendingHolidayName}. Do you want to proceed?`}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel
                      onClick={() => {
                        setPendingDate(null);
                        setPendingRange(null);
                        setPendingHolidayName("");
                      }}
                    >
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => {
                        if (pendingDate) {
                          if (pendingDate.action === "add") {
                            setSelectedDates([
                              ...selectedDates,
                              pendingDate.date,
                            ]);
                          }
                          setPendingDate(null);
                        }
                        if (pendingRange) {
                          setCurrentRange(pendingRange);
                          setPendingRange(null);
                        }
                        setPendingHolidayName("");
                        setShowWarningDialog(false);
                      }}
                    >
                      Continue
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              {errors.eventDate && (
                <p className="text-sm text-red-500">{errors.eventDate}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="eventTimeFrom">Start Time</Label>
              <div className="relative">
                <Input
                  id="eventTimeFrom"
                  type="time"
                  value={tempTimeFrom}
                  onChange={(e) => {
                    setTempTimeFrom(e.target.value);
                  }}
                />
                <Button
                  type="button"
                  size="sm"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2"
                  onClick={() => {
                    setEventTimeFrom(tempTimeFrom);
                    if (tempTimeFrom && eventTimeTo) {
                      const start = parse(tempTimeFrom, "HH:mm", new Date());
                      const end = parse(eventTimeTo, "HH:mm", new Date());
                      if (isBefore(end, start)) {
                        setIsTimeValid(false);
                        toast.warning(
                          "End time cannot be earlier than start time."
                        );
                      } else {
                        setIsTimeValid(true);
                      }
                    }
                  }}
                >
                  OK
                </Button>
              </div>
              {errors.eventTimeFrom && (
                <p className="text-sm text-red-500">{errors.eventTimeFrom}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="eventTimeTo">End Time</Label>
              <div className="relative">
                <Input
                  id="eventTimeTo"
                  type="time"
                  value={tempTimeTo}
                  onChange={(e) => {
                    setTempTimeTo(e.target.value);
                  }}
                />
                <Button
                  type="button"
                  size="sm"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2"
                  onClick={() => {
                    setEventTimeTo(tempTimeTo);
                    if (eventTimeFrom && tempTimeTo) {
                      const start = parse(eventTimeFrom, "HH:mm", new Date());
                      const end = parse(tempTimeTo, "HH:mm", new Date());
                      if (isBefore(end, start)) {
                        setIsTimeValid(false);
                        toast.warning(
                          "End time cannot be earlier than start time."
                        );
                      } else {
                        setIsTimeValid(true);
                      }
                    }
                  }}
                >
                  OK
                </Button>
              </div>
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
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="academic"
                  checked={eventType.includes("Academic")}
                  onCheckedChange={(checked) => {
                    setEventType((prev) => {
                      const newTypes = checked
                        ? [...prev, "Academic"]
                        : prev.filter((t) => t !== "Academic");
                      return newTypes;
                    });
                    setSelectedCategories([]); // Reset categories when type changes
                    setTempSelectedCategories([]);
                  }}
                />
                <label htmlFor="academic">Academic</label>

                <Checkbox
                  id="nonAcademic"
                  checked={eventType.includes("Non-Academic")}
                  onCheckedChange={(checked) => {
                    setEventType((prev) => {
                      const newTypes = checked
                        ? [...prev, "Non-Academic"]
                        : prev.filter((t) => t !== "Non-Academic");
                      return newTypes;
                    });
                    setSelectedCategories([]); // Reset categories when type changes
                    setTempSelectedCategories([]);
                  }}
                />
                <label htmlFor="nonAcademic">Non-Academic</label>
              </div>
              {errors.eventType && (
                <p className="text-sm text-red-500">{errors.eventType}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="eventCategory">
                Event Category{" "}
                {selectedCategories.length > 0 &&
                  `(${selectedCategories.length} selected)`}
              </Label>
              <Dialog
                open={showCategoryDialog}
                onOpenChange={setShowCategoryDialog}
              >
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-between"
                    disabled={eventType.length === 0}
                  >
                    {selectedCategories.length > 0
                      ? `${selectedCategories.length} categories selected`
                      : eventType.length === 0
                      ? "Select Event Type first"
                      : "Select Categories"}
                    <ChevronDown className="h-4 w-4 opacity-50" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-[400px]">
                  <DialogHeader>
                    <DialogTitle>Select Categories</DialogTitle>
                  </DialogHeader>
                  <div className="max-h-[300px] overflow-y-auto">
                    <div className="p-2">
                      <Button
                        variant="outline"
                        className="w-full mb-2"
                        onClick={() => {
                          const allCategories = [
                            ...(eventType.includes("Academic")
                              ? academicCategories
                              : []),
                            ...(eventType.includes("Non-Academic")
                              ? nonAcademicCategories
                              : []),
                          ];
                          if (
                            tempSelectedCategories.length ===
                            allCategories.length
                          ) {
                            // If all are selected, unselect all
                            setTempSelectedCategories([]);
                          } else {
                            // Select all available categories
                            setTempSelectedCategories(allCategories);
                          }
                        }}
                      >
                        {tempSelectedCategories.length ===
                        [
                          ...(eventType.includes("Academic")
                            ? academicCategories
                            : []),
                          ...(eventType.includes("Non-Academic")
                            ? nonAcademicCategories
                            : []),
                        ].length
                          ? "Unselect All"
                          : "Select All Categories"}
                      </Button>

                      {eventType.includes("Academic") && (
                        <>
                          <div className="font-bold mt-4 mb-2">
                            Academic Categories
                          </div>
                          {academicCategories.map((category) => (
                            <div
                              key={category}
                              className="flex items-center space-x-2 p-2 hover:bg-accent rounded"
                            >
                              <Checkbox
                                checked={tempSelectedCategories.includes(
                                  category
                                )}
                                onCheckedChange={(checked) => {
                                  setTempSelectedCategories((prev) =>
                                    checked
                                      ? [...prev, category]
                                      : prev.filter((c) => c !== category)
                                  );
                                }}
                              />
                              <label className="text-sm">{category}</label>
                            </div>
                          ))}
                        </>
                      )}

                      {eventType.includes("Non-Academic") && (
                        <>
                          <div className="font-bold mt-4 mb-2">
                            Non-Academic Categories
                          </div>
                          {nonAcademicCategories.map((category) => (
                            <div
                              key={category}
                              className="flex items-center space-x-2 p-2 hover:bg-accent rounded"
                            >
                              <Checkbox
                                checked={tempSelectedCategories.includes(
                                  category
                                )}
                                onCheckedChange={(checked) => {
                                  setTempSelectedCategories((prev) =>
                                    checked
                                      ? [...prev, category]
                                      : prev.filter((c) => c !== category)
                                  );
                                }}
                              />
                              <label className="text-sm">{category}</label>
                            </div>
                          ))}
                        </>
                      )}
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setShowCategoryDialog(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={() => {
                        setSelectedCategories(tempSelectedCategories);
                        setEventCategory(tempSelectedCategories.join(", "));
                        setShowCategoryDialog(false);
                      }}
                    >
                      OK
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              {errors.eventCategory && (
                <p className="text-sm text-red-500">{errors.eventCategory}</p>
              )}
              {selectedCategories.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {selectedCategories.map((category) => (
                    <div
                      key={category}
                      className="bg-accent text-accent-foreground px-2 py-1 rounded-md text-sm flex items-center gap-1"
                    >
                      {category}
                      <button
                        onClick={() => {
                          setSelectedCategories((prev) => {
                            const newSelection = prev.filter(
                              (cat) => cat !== category
                            );
                            setEventCategory(newSelection.join(", "));
                            return newSelection;
                          });
                          setTempSelectedCategories((prev) =>
                            prev.filter((cat) => cat !== category)
                          );
                        }}
                        className="ml-1 hover:text-destructive"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
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
