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
} from "@/utils/participantUtils";
import {
  createParticipant,
} from "@/lib/appwrite";
import EditParticipantDialog from "./edit-participant-dialog/page";
import DeleteParticipantDialog from "./delete-participant-dialog/page";
import {debounce} from "lodash"

export default function ParticipantManagement({
  events,
  participants,
  setParticipants,
  currentEventId,
  setCurrentEventId,
  setActiveSection,
}) {
  const [participantData, setParticipantData] = useState({
    studentId: "",
    name: "",
    sex: "",
    age: "",
    school: "",
    year: "",
    section: "",
    ethnicGroup: "",
    otherEthnicGroup: "",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [addButtonText, setAddButtonText] = useState("Add Participant");
  const [isEditingParticipant, setIsEditingParticipant] = useState(false);
  const [totalParticipants, setTotalParticipants] = useState(0);
  const [totalMaleParticipants, setTotalMaleParticipants] = useState(0);
  const [totalFemaleParticipants, setTotalFemaleParticipants] = useState(0);
  const [duplicateErrors, setDuplicateErrors] = useState("");
  const [showFinishButton, setShowFinishButton] = useState(false);
  const [showAutofillDialog, setShowAutofillDialog] = useState(false);
  const [autofillData, setAutofillData] = useState(null);
  const [newEntryInfo, setNewEntryInfo] = useState({});

  const currentEvent = events.find((e) => e.$id === currentEventId);
  const isEventSelected = !!currentEvent;

  useEffect(() => {
    if (!isEventSelected) {
      toast.error("Please select a valid event.");
    }
  }, [isEventSelected]);

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
    setParticipantData((prev) => ({ ...prev, [field]: value }));

    if (field === "studentId" || field === "name") {
      const { duplicateErrors, newEntryInfo } = await debouncedCheckDuplicates(field, value, currentEventId);
      setDuplicateErrors((prev) => ({ ...prev, [field]: duplicateErrors }));
      setNewEntryInfo((prev) => ({ ...prev, [field]: newEntryInfo }));

      if (value) {
        try {
          const autofillData = await handleAutofill(value, currentEventId);
          if (autofillData) {
            setAutofillData(autofillData);
            setShowAutofillDialog(true);
          }
        } catch (error) {
          toast.error(error.message);
        }
      }
    }
  };

  const handleAutofillConfirm = () => {
    setParticipantData((prev) => ({
      ...prev,
      ...autofillData,
    }));
    setShowAutofillDialog(false);
    toast.info("Participant data from another event has been loaded.");
  };

  const handleAutofillCancel = () => {
    setShowAutofillDialog(false);
  };

   const handleAddParticipant = async (e) => {
    e.preventDefault();

    if (!validateParticipantForm(participantData, setErrors)) return;

    if (!currentEvent) {
      toast.error("No event selected");
      return;
    }

    if (duplicateErrors.studentId || duplicateErrors.name) {
      toast.error("Please resolve duplicate entries before adding the participant.");
      return;
    }

    setLoading(true);
    try {
      const newParticipant = {
        ...participantData,
        age: parseInt(participantData.age),
        eventId: currentEventId,
      };

      console.log("New participant data:", newParticipant); // Add this line for debugging


      const createdParticipant = await createParticipant(newParticipant);
      setParticipants((prev) => [...prev, createdParticipant]);
      toast.success(`Participant added to ${currentEvent.eventName}`);
      setParticipantData({
        studentId: "",
        name: "",
        sex: "",
        age: "",
        school: "",
        year: "",
        section: "",
        ethnicGroup: "",
        otherEthnicGroup: "",
      });
      setDuplicateErrors({});
      setShowFinishButton(true);
      setNewEntryInfo({});
    } catch (error) {
      console.error("Error details:", error); // Add this line for debugging
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
      school: "",
      year: "",
      section: "",
      ethnicGroup: "",
      otherEthnicGroup: "",
    });

    // Reset participants state
    setParticipants([]);
    setCurrentEventId(null); // Clear the selected event

    // Reset event selection and counts
    setActiveSection("overview"); // Navigate to the overview or another section
    setTotalParticipants(0);
    setTotalMaleParticipants(0);
    setTotalFemaleParticipants(0);
    setShowFinishButton(false);
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
    // Retrieve saved state from localStorage
    const savedParticipantData = localStorage.getItem("participantData");
    const savedParticipants = localStorage.getItem("participants");

    if (savedParticipantData) {
      setParticipantData(JSON.parse(savedParticipantData));
    } else {
      // Initialize default participant data
      setParticipantData({
        studentId: "",
        name: "",
        sex: "",
        age: "",
        school: "",
        year: "",
        section: "",
        ethnicGroup: "",
        otherEthnicGroup: "",
      });
    }

    if (savedParticipants) {
      setParticipants(JSON.parse(savedParticipants));
    } else {
      setParticipants([]);
    }
  }, []);

  useEffect(() => {
    // Save participant data and participants list to localStorage
    localStorage.setItem("participantData", JSON.stringify(participantData));
    localStorage.setItem("participants", JSON.stringify(participants));
  }, [participantData, participants]); // Save changes when these states are updated

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add Participant</CardTitle>
        <CardDescription>
          {currentEvent
            ? `Add participants to ${
                events.find((e) => e.$id === currentEventId)?.eventName
              }`
            : "No active event selected"}
        </CardDescription>{" "}
        <div className="grid grid-cols-3 gap-4 mb-6">
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
      <form onSubmit={handleAddParticipant}>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="studentId">Student ID</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="relative">
                      <Input
                        id="studentId"
                        value={participantData.studentId}
                        onChange={(e) => {
                          const newStudentId = formatStudentId(e.target.value);
                          handleInputChange("studentId", e.target.value); // Calling the existing function with the raw value
                          setParticipantData({
                            ...participantData,
                            studentId: newStudentId, // Update the studentId after formatting
                          });
                          setDuplicateErrors(""); // Clear any previous duplicate errors
                        }}
                        placeholder="00-00-0000"
                        maxLength={10}
                        disabled={!isEventSelected}
                      />
                      <HelpCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Enter Ascot Valid Student ID </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              {errors.studentId && (
                <p className="text-sm text-red-500">{errors.studentId}</p>
              )}
              {duplicateErrors.studentId && (
                <p className="text-sm text-red-500">
                  {duplicateErrors.studentId}
                </p>
              )}
                 {newEntryInfo.studentId && (
                <p className="text-sm text-green-500">{newEntryInfo.studentId}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={participantData.name}
                onChange={(e) => {
                  const formattedName = capitalizeWords(e.target.value); // Capitalize the name
                  handleInputChange("name", e.target.value); // Calling the existing function with the raw value
                  setParticipantData({
                    ...participantData,
                    name: formattedName, // Update the name after capitalizing
                  });
                  setDuplicateErrors(""); // Clear any previous duplicate errors
                }}
                placeholder="Enter full name"
                disabled={!isEventSelected}
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name}</p>
              )}
              {duplicateErrors.name && (
                <p className="text-sm text-red-500">{duplicateErrors.name}</p>
              )}
                {newEntryInfo.name && (
                <p className="text-sm text-green-500">{newEntryInfo.name}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="sex">Sex</Label>
              <Select
                value={participantData.sex} // Ensure this value comes from participantData
                onValueChange={(value) =>
                  setParticipantData({ ...participantData, sex: value })
                }
                disabled={!isEventSelected}
              >
                <SelectTrigger id="sex">
                  <SelectValue placeholder="Select sex" />
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
                value={participantData.ethnicGroup} // Ensure this value comes from participantData
                onValueChange={(value) =>
                  setParticipantData({
                    ...participantData,
                    ethnicGroup: value,
                    otherEthnicGroup:
                      value === "Other" ? "" : participantData.otherEthnicGroup,
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
                <p className="text-sm text-red-500">{errors.ethnicGroup}</p>
              )}
            </div>
            {participantData.ethnicGroup === "Other" && (
              <div className="space-y-2">
                <Label htmlFor="otherEthnicGroup">Specify Ethnic Group</Label>
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
          </div>
        
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => setActiveSection("create")}
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
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                "Add Participant"
              )}
            </Button>
            <Button
              type="button"
              onClick={handleFinishAddingParticipants}
              disabled={totalParticipants === 0} // Disabled if no participants added
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
            <TableHead className="text-center">School</TableHead>
            <TableHead>Year</TableHead>
            <TableHead>Section</TableHead>
            <TableHead>Ethnic Group</TableHead>
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
              <TableCell>{participant.year}</TableCell>
              <TableCell>{participant.section}</TableCell>
              <TableCell>
                {participant.ethnicGroup === "Other"
                  ? participant.otherEthnicGroup
                  : participant.ethnicGroup}
              </TableCell>
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
      <AlertDialog
        open={showAutofillDialog}
        onOpenChange={setShowAutofillDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Autofill Participant Data</AlertDialogTitle>
            <AlertDialogDescription>
              Participant data from another event has been found. Would you like
              to autofill the form with this data?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleAutofillCancel}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleAutofillConfirm}>
              Yes, Autofill
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
