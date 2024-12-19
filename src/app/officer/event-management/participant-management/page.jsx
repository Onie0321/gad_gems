import React, { useState, useEffect, useCallback } from "react";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "react-toastify";
import { Loader2, HelpCircle, Edit, Trash2 } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  capitalizeWords,
  validateParticipantForm,
  formatStudentId,
  schoolOptions,
  debouncedCheckDuplicates,
  handleAutofill,
  isStudentIdComplete,
  checkDuplicates,
} from "@/utils/participantUtils";
import {
  createParticipant,
  getCurrentUser,
  checkDuplicateParticipant,
} from "@/lib/appwrite";
import EditParticipantDialog from "./edit-participant-dialog/page";
import DeleteParticipantDialog from "./delete-participant-dialog/page";
import { debounce } from "lodash";
import { usePathname, useRouter } from "next/navigation";
import ParticipantTypeSelector from "./participant-type-selector/page";

export default function ParticipantManagement({
  events,
  currentEventId,
  setCurrentEventId,
  user,
  setActiveTab,
}) {
  const [participantData, setParticipantData] = useState({
    studentId: "",
    name: "",
    sex: "",
    age: "",
    homeAddress: "",
    school: "",
    year: "",
    section: "",
    ethnicGroup: "",
    otherEthnicGroup: "",
    department: "",
    position: "",
    organization: "",
    contactNumber: "",
  });
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [totalParticipants, setTotalParticipants] = useState(0);
  const [totalMaleParticipants, setTotalMaleParticipants] = useState(0);
  const [totalFemaleParticipants, setTotalFemaleParticipants] = useState(0);
  const [showAutofillDialog, setShowAutofillDialog] = useState(false);
  const [autofillData, setAutofillData] = useState(null);
  const [newEntryInfo, setNewEntryInfo] = useState({});
  const [duplicateErrors, setDuplicateErrors] = useState({
    studentId: "",
    name: "",
  });
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [hasAddedParticipants, setHasAddedParticipants] = useState(false);
  const [foundParticipant, setFoundParticipant] = useState(null);
  const router = useRouter();
  const pathname = usePathname();
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [participantType, setParticipantType] = useState("student");

  const currentEvent = events.find((e) => e.$id === currentEventId);
  const isEventSelected = !!currentEvent;

  // Effect to update counters whenever participants change
  useEffect(() => {
    const currentEventParticipants = participants.filter(
      (p) => p.eventId === currentEventId
    );
    setTotalParticipants(currentEventParticipants.length);
    setTotalMaleParticipants(
      currentEventParticipants.filter((p) => p.sex === "Male").length
    );
    setTotalFemaleParticipants(
      currentEventParticipants.filter((p) => p.sex === "Female").length
    );
  }, [participants, currentEventId]);

  const handleInputChange = async (field, value) => {
    try {
      if (field === "studentId" || field === "name") {
        if (field === "studentId" && !isStudentIdComplete(value)) {
          setDuplicateErrors((prev) => ({ ...prev, [field]: "" }));
          setNewEntryInfo((prev) => ({ ...prev, [field]: "" }));
          return;
        }

        const result = await debouncedCheckDuplicates(
          field,
          value,
          currentEventId
        );
        if (result) {
          const { duplicateError, newEntryInfo } = result;
          setDuplicateErrors((prev) => ({ ...prev, [field]: duplicateError }));
          setNewEntryInfo((prev) => ({ ...prev, [field]: newEntryInfo }));
        }

        if (value && field === "studentId") {
          const autofillData = await handleAutofill(value, currentEventId);
          if (autofillData) {
            setAutofillData(autofillData);
            setShowAutofillDialog(true);
          }
        }
      }
    } catch (error) {
      console.error("Error in handleInputChange:", error);
      toast.error("An error occurred while processing your input.");
    }
  };

  const debouncedCheckDuplicates = debounce(async (field, value) => {
    const { duplicateError, newEntryInfo } = await checkDuplicates(
      field,
      value,
      currentEventId
    );
    setDuplicateErrors((prev) => ({ ...prev, [field]: duplicateError }));
    setNewEntryInfo((prev) => ({ ...prev, [field]: newEntryInfo }));
  }, 500);

  const handleAutofillCancel = () => {
    setShowAutofillDialog(false);
    setFoundParticipant(null);
  };

  // In your handleAddParticipant function
  const handleAddParticipant = async (e) => {
    e.preventDefault();

    // Check for duplicates before submitting
    const isDuplicateId = await checkDuplicateInCurrentEvent(
      "studentId",
      participantData.studentId
    );
    const isDuplicateName = await checkDuplicateInCurrentEvent(
      "name",
      participantData.name
    );

    if (isDuplicateId || isDuplicateName) {
      toast.error("Cannot add duplicate participant");
      return;
    }

    if (!validateParticipantForm(participantData, setErrors)) return;

    if (!currentEvent) {
      toast.error("No event selected");
      return;
    }

    if (!user || !user.$id) {
      toast.error("User not authenticated. Please log in and try again.");
      return;
    }

    setLoading(true);
    try {
      const newParticipant = {
        ...participantData,
        age: parseInt(participantData.age),
        eventId: currentEventId,
        createdBy: user.name,
      };

      const createdParticipant = await createParticipant(
        newParticipant,
        user.$id
      );

      if (createdParticipant) {
        setParticipants((prev) => [...prev, createdParticipant]);
        setHasAddedParticipants(true); // Set the flag when first participant is added
        toast.success(`Participant added to ${currentEvent.eventName}`);
        // Reset form
        setParticipantData({
          studentId: "",
          name: "",
          sex: "",
          age: "",
          homeAddress: "",
          school: "",
          year: "",
          section: "",
          ethnicGroup: "",
          otherEthnicGroup: "",
          department: "",
          position: "",
          organization: "",
          contactNumber: "",
        });
      }
    } catch (error) {
      console.error("Error details:", error);
      toast.error(`Error adding participant: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  const handleFinishAddingParticipants = () => {
    setParticipantData({
      studentId: "",
      name: "",
      sex: "",
      age: "",
      homeAddress: "",
      school: "",
      year: "",
      section: "",
      ethnicGroup: "",
      otherEthnicGroup: "",
      department: "",
      position: "",
      organization: "",
      contactNumber: "",
    });

    setParticipants([]);
    setCurrentEventId(null);
    setHasAddedParticipants(false);

    setTotalParticipants(0);
    setTotalMaleParticipants(0);
    setTotalFemaleParticipants(0);

    setShowSuccessMessage(true);
    toast.success("Event created successfully.");

    // Redirect to EventOverview
    setActiveTab("overview");
  };

  const handleUpdateParticipant = (updatedParticipant) => {
    const updatedParticipants = participants.map((p) =>
      p.studentId === updatedParticipant.studentId ? updatedParticipant : p
    );
    setParticipants(updatedParticipants);
  };

  const handleDeleteParticipant = (participantId) => {
    const updatedParticipants = participants.filter(
      (p) => p.studentId !== participantId
    );
    setParticipants(updatedParticipants);
  };

  useEffect(() => {
    if (showSuccessMessage) {
      const timer = setTimeout(() => {
        setShowSuccessMessage(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [showSuccessMessage]);

  useEffect(() => {
    // Load saved data when component mounts
    const savedData = localStorage.getItem(`participantData_${currentEventId}`);
    const savedParticipants = localStorage.getItem(
      `participants_${currentEventId}`
    );

    if (savedData) {
      setParticipantData(JSON.parse(savedData));
    }
    if (savedParticipants) {
      setParticipants(JSON.parse(savedParticipants));
    }
  }, [currentEventId]);

  // Save data whenever it changes
  useEffect(() => {
    if (currentEventId) {
      localStorage.setItem(
        `participantData_${currentEventId}`,
        JSON.stringify(participantData)
      );
      localStorage.setItem(
        `participants_${currentEventId}`,
        JSON.stringify(participants)
      );
    }
  }, [participantData, participants, currentEventId]);

  const checkDuplicateInCurrentEvent = async (field, value) => {
    if (!value || !currentEventId) return false;

    try {
      const isDuplicate = await checkDuplicateParticipant(
        currentEventId,
        field === "studentId" ? value : "",
        field === "name" ? value : ""
      );

      if (isDuplicate) {
        setDuplicateErrors((prev) => ({
          ...prev,
          [field]: `This ${
            field === "studentId" ? "Student ID" : "Name"
          } is already registered in this event.`,
        }));
        return true;
      } else {
        setDuplicateErrors((prev) => ({
          ...prev,
          [field]: "",
        }));
        return false;
      }
    } catch (error) {
      console.error(`Error checking duplicate ${field}:`, error);
      toast.error(`Error checking for duplicate ${field}`);
      return false;
    }
  };

  const handleStudentIdChange = async (e) => {
    const formattedId = formatStudentId(e.target.value);
    setParticipantData((prev) => ({ ...prev, studentId: formattedId }));

    if (isStudentIdComplete(formattedId)) {
      try {
        // Check for duplicate in current event first
        const isDuplicateInEvent = await checkDuplicateInCurrentEvent(
          "studentId",
          formattedId
        );

        if (isDuplicateInEvent) {
          // If duplicate found, don't proceed with autofill
          return;
        }

        // Only proceed with autofill if no duplicate found
        const foundData = await handleAutofill(formattedId, currentEventId);
        if (foundData) {
          setAutofillData(foundData);
          setShowConfirmDialog(true);
        }
      } catch (error) {
        console.error("Error during student ID check:", error);
        toast.error("Error checking participant data");
      }
    } else {
      // Clear duplicate errors when student ID is incomplete
      setDuplicateErrors((prev) => ({
        ...prev,
        studentId: "",
      }));
    }
  };

  const handleNameChange = async (e) => {
    const name = capitalizeWords(e.target.value);
    setParticipantData((prev) => ({ ...prev, name }));

    if (name.length >= 3) {
      try {
        // Check for duplicate in current event first
        const isDuplicateInEvent = await checkDuplicateInCurrentEvent(
          "name",
          name
        );

        if (isDuplicateInEvent) {
          // If duplicate found, don't proceed with autofill
          return;
        }

        // Only proceed with autofill if no duplicate found
        const foundData = await handleAutofill(name, currentEventId);
        if (foundData) {
          setAutofillData(foundData);
          setShowConfirmDialog(true);
        }
      } catch (error) {
        console.error("Error during name check:", error);
        toast.error("Error checking participant data");
      }
    } else {
      // Clear duplicate errors when name is too short
      setDuplicateErrors((prev) => ({
        ...prev,
        name: "",
      }));
    }
  };

  const handleInitialConfirm = () => {
    setShowConfirmDialog(false);
    setShowDetailsDialog(true); // Show details dialog after initial confirmation
  };

  const handleAutofillConfirm = () => {
    if (autofillData) {
      setParticipantData({
        studentId: autofillData.studentId,
        name: autofillData.name,
        sex: autofillData.sex,
        age: autofillData.age,
        homeAddress: autofillData.homeAddress || "",
        school: autofillData.school,
        year: autofillData.year,
        section: autofillData.section,
        ethnicGroup: autofillData.ethnicGroup,
        otherEthnicGroup: autofillData.otherEthnicGroup || "",
        department: autofillData.department || "",
        position: autofillData.position || "",
        organization: autofillData.organization || "",
        contactNumber: autofillData.contactNumber || "",
      });

      toast.success(
        `Data auto-filled from existing participant in ${
          autofillData.eventName || "another event"
        }`
      );
    }
    setShowDetailsDialog(false);
    setAutofillData(null);
  };

  const handleCancel = () => {
    setShowConfirmDialog(false);
    setShowDetailsDialog(false);
    setAutofillData(null);
  };

  useEffect(() => {
    console.log("Dialog state changed:", showAutofillDialog);
    console.log("Found participant:", foundParticipant);
  }, [showAutofillDialog, foundParticipant]);

  useEffect(() => {
    // Reset form when participant type changes
    setParticipantData({
      // Common fields
      name: "",
      age: "",
      sex: "",
      homeAddress: "",

      // Student-specific fields
      studentId: participantType === "student" ? "" : undefined,
      school: participantType === "student" ? "" : undefined,
      year: participantType === "student" ? "" : undefined,
      section: participantType === "student" ? "" : undefined,
      ethnicGroup: participantType === "student" ? "" : undefined,
      otherEthnicGroup: participantType === "student" ? "" : undefined,

      // Staff-specific fields
      staffId: participantType === "staff" ? "" : undefined,
    });
  }, [participantType]);

  return (
    <>
      {/* Initial Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Existing Participant Found</AlertDialogTitle>
            <AlertDialogDescription>
              A participant with this{" "}
              {autofillData?.studentId ? "Student ID" : "name"} was found in
              another event. Would you like to see their details and potentially
              autofill the form?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancel}>
              No, Keep Empty
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleInitialConfirm}>
              Yes, Show Details
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Details and Autofill Dialog */}
      <AlertDialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Participant Details</AlertDialogTitle>
            <AlertDialogDescription>
              {autofillData && (
                <div className="space-y-4">
                  <p>Participant data found from another event:</p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <strong>Name:</strong> {autofillData.name}
                    </div>
                    <div>
                      <strong>Student ID:</strong> {autofillData.studentId}
                    </div>
                    <div>
                      <strong>Sex:</strong> {autofillData.sex}
                    </div>
                    <div>
                      <strong>Age:</strong> {autofillData.age}
                    </div>
                    <div>
                      <strong>School:</strong> {autofillData.school}
                    </div>
                    <div>
                      <strong>Year:</strong> {autofillData.year}
                    </div>
                    <div>
                      <strong>Section:</strong> {autofillData.section}
                    </div>
                    <div>
                      <strong>Ethnic Group:</strong> {autofillData.ethnicGroup}
                    </div>
                  </div>
                  <p className="mt-2">
                    Would you like to autofill the form with this data?
                  </p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancel}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleAutofillConfirm}>
              Yes, Autofill
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Card>
        <CardHeader>
          <CardTitle>Add Participant</CardTitle>
          <CardDescription>
            {currentEventId && currentEvent
              ? `Add participants to ${currentEvent.eventName}`
              : "No active event created"}
          </CardDescription>

          {/* Add participant type selector */}
          {isEventSelected && (
            <ParticipantTypeSelector
              selectedType={participantType}
              onTypeChange={setParticipantType}
            />
          )}

          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-primary text-primary-foreground p-4 rounded-lg">
              <h3 className="text-lg font-semibold">Total Participants</h3>
              <p className="text-3xl font-bold">{totalParticipants}</p>
            </div>
            <div className="bg-blue-500 text-white p-4 rounded-lg">
              <h3 className="text-lg font-semibold">Male Participants</h3>
              <p className="text-3xl font-bold">{totalMaleParticipants}</p>
            </div>
            <div className="bg-pink-500 text-white p-4 rounded-lg">
              <h3 className="text-lg font-semibold">Female Participants</h3>
              <p className="text-3xl font-bold">{totalFemaleParticipants}</p>
            </div>
          </div>
          {!isEventSelected && (
            <Alert variant="destructive" className="mb-4">
              <AlertTitle>Warning</AlertTitle>
              <AlertDescription>
                Please add an event before adding participants.
              </AlertDescription>
            </Alert>
          )}
        </CardHeader>
        {showSuccessMessage && (
          <Alert variant="success" className="mb-4">
            <AlertTitle>Success</AlertTitle>
            <AlertDescription>
              Event created successfully. Waiting for admin approval.
            </AlertDescription>
          </Alert>
        )}
        <form onSubmit={handleAddParticipant}>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {participantType === "student" ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="studentId">Student ID</Label>
                    <Input
                      id="studentId"
                      value={participantData.studentId}
                      onChange={handleStudentIdChange}
                      placeholder="00-00-0000"
                      maxLength={10}
                      disabled={!isEventSelected}
                      className={
                        duplicateErrors.studentId ? "border-red-500" : ""
                      }
                    />
                    {duplicateErrors.studentId && (
                      <p className="text-sm text-red-500 font-medium">
                        {duplicateErrors.studentId}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={participantData.name}
                      onChange={handleNameChange}
                      placeholder="Enter full name"
                      disabled={!isEventSelected}
                      className={duplicateErrors.name ? "border-red-500" : ""}
                    />
                    {duplicateErrors.name && (
                      <p className="text-sm text-red-500 font-medium">
                        {duplicateErrors.name}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sex">Sex at Birth</Label>
                    <Select
                      value={participantData.sex}
                      onValueChange={(value) =>
                        setParticipantData({ ...participantData, sex: value })
                      }
                      disabled={!isEventSelected}
                    >
                      <SelectTrigger id="sex">
                        <SelectValue placeholder="Select sex at Birth" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.sex && (
                      <p className="text-sm text-red-500">{errors.sex}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="age">Age</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="relative">
                            <Input
                              id="age"
                              type="number"
                              value={participantData.age}
                              onChange={(e) => {
                                const value = e.target.value;
                                if (
                                  value === "" ||
                                  (parseInt(value) >= 1 &&
                                    parseInt(value) <= 125)
                                ) {
                                  setParticipantData({
                                    ...participantData,
                                    age: value,
                                  });
                                }
                              }}
                              placeholder="Enter age"
                              min="1"
                              max="125"
                              disabled={!isEventSelected}
                            />
                            <HelpCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Age must be between 1 and 125</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    {errors.age && (
                      <p className="text-sm text-red-500">{errors.age}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="homeAddress">Home Address</Label>
                    <Input
                      id="homeAddress"
                      value={participantData.homeAddress}
                      onChange={(e) =>
                        setParticipantData({
                          ...participantData,
                          homeAddress: capitalizeWords(e.target.value),
                        })
                      }
                      placeholder="Enter home address"
                      disabled={!isEventSelected}
                    />
                    {errors.homeAddress && (
                      <p className="text-sm text-red-500">
                        {errors.homeAddress}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="school">School</Label>
                    <Select
                      onValueChange={(value) =>
                        setParticipantData({
                          ...participantData,
                          school: value,
                          year: "",
                          section: "",
                        })
                      }
                      value={participantData.school}
                      disabled={!isEventSelected}
                    >
                      <SelectTrigger id="school">
                        <SelectValue placeholder="Select school" />
                      </SelectTrigger>
                      <SelectContent>
                        {schoolOptions.map((school) => (
                          <SelectItem key={school.abbr} value={school.name}>
                            {school.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.school && (
                      <p className="text-sm text-red-500">{errors.school}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="year">Year</Label>
                    <Select
                      onValueChange={(value) =>
                        setParticipantData({
                          ...participantData,
                          year: value,
                          section: "",
                        })
                      }
                      value={participantData.year}
                      disabled={!participantData.school}
                    >
                      <SelectTrigger id="year">
                        <SelectValue
                          placeholder={
                            participantData.school
                              ? "Select year"
                              : "Select school first"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {[
                          "First Year",
                          "Second Year",
                          "Third Year",
                          "Fourth Year",
                          "Fifth Year",
                        ].map((year) => (
                          <SelectItem key={year} value={year}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.year && (
                      <p className="text-sm text-red-500">{errors.year}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="section">Section</Label>
                    <Input
                      id="section"
                      value={participantData.section}
                      onChange={(e) =>
                        setParticipantData({
                          ...participantData,
                          section: capitalizeWords(e.target.value),
                        })
                      }
                      placeholder="Enter section"
                      disabled={!participantData.year}
                    />
                    {errors.section && (
                      <p className="text-sm text-red-500">{errors.section}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ethnicGroup">Ethnic Group</Label>
                    <Select
                      value={participantData.ethnicGroup}
                      onValueChange={(value) =>
                        setParticipantData({
                          ...participantData,
                          ethnicGroup: value,
                          otherEthnicGroup:
                            value === "Other"
                              ? ""
                              : participantData.otherEthnicGroup,
                        })
                      }
                      disabled={!isEventSelected}
                    >
                      <SelectTrigger id="ethnicGroup">
                        <SelectValue placeholder="Select ethnic group" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Tagalog">Tagalog</SelectItem>
                        <SelectItem value="Cebuano">Cebuano</SelectItem>
                        <SelectItem value="Ilocano">Ilocano</SelectItem>
                        <SelectItem value="Bicolano">Bicolano</SelectItem>
                        <SelectItem value="Waray">Waray</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.ethnicGroup && (
                      <p className="text-sm text-red-500">
                        {errors.ethnicGroup}
                      </p>
                    )}
                  </div>
                  {participantData.ethnicGroup === "Other" && (
                    <div className="space-y-2">
                      <Label htmlFor="otherEthnicGroup">
                        Specify Ethnic Group
                      </Label>
                      <Input
                        id="otherEthnicGroup"
                        value={participantData.otherEthnicGroup}
                        onChange={(e) =>
                          setParticipantData({
                            ...participantData,
                            otherEthnicGroup: capitalizeWords(e.target.value),
                          })
                        }
                        placeholder="Enter ethnic group"
                      />
                      {errors.otherEthnicGroup && (
                        <p className="text-sm text-red-500">
                          {errors.otherEthnicGroup}
                        </p>
                      )}
                    </div>
                  )}
                </>
              ) : participantType === "staff" ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="staffId">Staff/Faculty ID</Label>
                    <Input
                      id="staffId"
                      value={participantData.staffId}
                      onChange={(e) =>
                        setParticipantData({
                          ...participantData,
                          staffId: e.target.value,
                        })
                      }
                      placeholder="Enter Staff/Faculty ID"
                      disabled={!isEventSelected}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={participantData.name}
                      onChange={(e) =>
                        setParticipantData({
                          ...participantData,
                          name: capitalizeWords(e.target.value),
                        })
                      }
                      placeholder="Enter full name"
                      disabled={!isEventSelected}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="age">Age</Label>
                    <Input
                      id="age"
                      type="number"
                      value={participantData.age}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (
                          value === "" ||
                          (parseInt(value) >= 1 && parseInt(value) <= 125)
                        ) {
                          setParticipantData({
                            ...participantData,
                            age: value,
                          });
                        }
                      }}
                      placeholder="Enter age"
                      min="1"
                      max="125"
                      disabled={!isEventSelected}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sex">Sex at Birth</Label>
                    <Select
                      value={participantData.sex}
                      onValueChange={(value) =>
                        setParticipantData({ ...participantData, sex: value })
                      }
                      disabled={!isEventSelected}
                    >
                      <SelectTrigger id="sex">
                        <SelectValue placeholder="Select sex at Birth" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="homeAddress">Address</Label>
                    <Input
                      id="homeAddress"
                      value={participantData.homeAddress}
                      onChange={(e) =>
                        setParticipantData({
                          ...participantData,
                          homeAddress: capitalizeWords(e.target.value),
                        })
                      }
                      placeholder="Enter address"
                      disabled={!isEventSelected}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={participantData.name}
                      onChange={(e) =>
                        setParticipantData({
                          ...participantData,
                          name: capitalizeWords(e.target.value),
                        })
                      }
                      placeholder="Enter full name"
                      disabled={!isEventSelected}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="age">Age</Label>
                    <Input
                      id="age"
                      type="number"
                      value={participantData.age}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (
                          value === "" ||
                          (parseInt(value) >= 1 && parseInt(value) <= 125)
                        ) {
                          setParticipantData({
                            ...participantData,
                            age: value,
                          });
                        }
                      }}
                      placeholder="Enter age"
                      min="1"
                      max="125"
                      disabled={!isEventSelected}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sex">Sex at Birth</Label>
                    <Select
                      value={participantData.sex}
                      onValueChange={(value) =>
                        setParticipantData({ ...participantData, sex: value })
                      }
                      disabled={!isEventSelected}
                    >
                      <SelectTrigger id="sex">
                        <SelectValue placeholder="Select sex at Birth" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="homeAddress">Address</Label>
                    <Input
                      id="homeAddress"
                      value={participantData.homeAddress}
                      onChange={(e) =>
                        setParticipantData({
                          ...participantData,
                          homeAddress: capitalizeWords(e.target.value),
                        })
                      }
                      placeholder="Enter address"
                      disabled={!isEventSelected}
                    />
                  </div>
                </>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setCurrentEventId(null);
                setHasAddedParticipants(false); // Reset the flag when going back
              }}
            >
              Back to Events
            </Button>
            <div>
              <Button
                type="submit"
                disabled={
                  loading ||
                  !currentEventId ||
                  !!duplicateErrors.studentId ||
                  !!duplicateErrors.name
                }
                className="mr-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Please wait
                  </>
                ) : hasAddedParticipants ? (
                  "Add Another Participant"
                ) : (
                  "Add Participant"
                )}
              </Button>
              <Button
                type="button"
                onClick={handleFinishAddingParticipants}
                disabled={totalParticipants === 0}
                className={
                  totalParticipants === 0 ? "opacity-50 cursor-not-allowed" : ""
                }
              >
                Finish Adding Participants
              </Button>
            </div>
          </CardFooter>
        </form>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Sex</TableHead>
              <TableHead>Age</TableHead>
              <TableHead>School</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {participants.map((participant) => (
              <TableRow key={participant.$id}>
                <TableCell>{participant.studentId}</TableCell>
                <TableCell>{participant.name}</TableCell>
                <TableCell>{participant.sex}</TableCell>
                <TableCell>{participant.age}</TableCell>
                <TableCell>{participant.school}</TableCell>
                <TableCell>
                  <EditParticipantDialog
                    participant={participant}
                    onUpdateParticipant={handleUpdateParticipant}
                  />
                  <DeleteParticipantDialog
                    participant={participant}
                    onDeleteParticipant={handleDeleteParticipant}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </>
  );
}
