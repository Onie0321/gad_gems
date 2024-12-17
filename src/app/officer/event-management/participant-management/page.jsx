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
import { createParticipant, getCurrentUser } from "@/lib/appwrite";
import EditParticipantDialog from "./edit-participant-dialog/page";
import DeleteParticipantDialog from "./delete-participant-dialog/page";
import { debounce } from "lodash";
import { usePathname, useRouter } from "next/navigation";

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
  });
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [totalParticipants, setTotalParticipants] = useState(0);
  const [totalMaleParticipants, setTotalMaleParticipants] = useState(0);
  const [totalFemaleParticipants, setTotalFemaleParticipants] = useState(0);
  const [totalIntersexParticipants, setTotalIntersexParticipants] = useState(0);
  const [showAutofillDialog, setShowAutofillDialog] = useState(false);
  const [autofillData, setAutofillData] = useState(null);
  const [newEntryInfo, setNewEntryInfo] = useState({});
  const [duplicateErrors, setDuplicateErrors] = useState({});
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [hasAddedParticipants, setHasAddedParticipants] = useState(false);
  const [foundParticipant, setFoundParticipant] = useState(null);
  const [showAutoFillDialog, setShowAutoFillDialog] = useState(false);
const router = useRouter();
const pathname = usePathname();

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
    setTotalIntersexParticipants(
      currentEventParticipants.filter((p) => p.sex === "Intersex").length
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

  const handleAutofillConfirm = () => {
    console.log("Auto-filling with data:", foundParticipant); // Debug log
    if (foundParticipant) {
      setParticipantData((prev) => ({
        ...prev,
        name: foundParticipant.name,
        sex: foundParticipant.sex,
        age: foundParticipant.age,
        homeAddress: foundParticipant.homeAddress,
        school: foundParticipant.school,
        year: foundParticipant.year,
        section: foundParticipant.section,
        ethnicGroup: foundParticipant.ethnicGroup,
        otherEthnicGroup: foundParticipant.otherEthnicGroup,
      }));
    }
    setShowAutoFillDialog(false);
    setFoundParticipant(null);
  };

  const handleAutofillCancel = () => {
    setShowAutofillDialog(false);
  };

  // In your handleAddParticipant function
  const handleAddParticipant = async (e) => {
    e.preventDefault();

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
    });

    setParticipants([]);
    setCurrentEventId(null);
    setHasAddedParticipants(false);

    setTotalParticipants(0);
    setTotalMaleParticipants(0);
    setTotalFemaleParticipants(0);
    setTotalIntersexParticipants(0);

    setShowSuccessMessage(true);
    toast.success("Event created successfully. Waiting for admin approval.");

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

  const handleStudentIdChange = (e) => {
    if (!e || !e.target) return; // Add error checking

    const studentId = formatStudentId(e.target.value);
    setParticipantData((prev) => ({ ...prev, studentId }));

    if (isStudentIdComplete(studentId)) {
      handleAutofill(studentId, currentEventId)
        .then((participant) => {
          if (participant) {
            setFoundParticipant(participant);
            setShowAutoFillDialog(true);
          }
        })
        .catch((error) => {
          console.error("Error finding participant:", error);
          toast.error("Error finding participant data");
        });
    }
  };

  const handleAutoFillConfirm = () => {
    console.log("Confirming autofill with data:", foundParticipant); // Debug log

    if (foundParticipant) {
      setParticipantData((prev) => ({
        ...prev,
        name: foundParticipant.name,
        sex: foundParticipant.sex,
        age: foundParticipant.age,
        homeAddress: foundParticipant.homeAddress,
        school: foundParticipant.school,
        year: foundParticipant.year,
        section: foundParticipant.section,
        ethnicGroup: foundParticipant.ethnicGroup,
        otherEthnicGroup: foundParticipant.otherEthnicGroup,
      }));
    }
    setShowAutoFillDialog(false);
    setFoundParticipant(null);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add Participant</CardTitle>
        <CardDescription>
          {currentEventId && currentEvent
            ? `Add participants to ${currentEvent.eventName}`
            : "No active event created"}
        </CardDescription>
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
          <div className="bg-purple-500 text-white p-4 rounded-lg">
            <h3 className="text-lg font-semibold">Intersex Participants</h3>
            <p className="text-3xl font-bold">{totalIntersexParticipants}</p>
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
                          handleInputChange("studentId", e.target.value);
                          setParticipantData({
                            ...participantData,
                            studentId: newStudentId,
                          });
                          setDuplicateErrors("");
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
              {isStudentIdComplete(participantData.studentId) && (
                <>
                  {errors.studentId && (
                    <p className="text-sm text-red-500">{errors.studentId}</p>
                  )}
                  {duplicateErrors.studentId && (
                    <p className="text-sm text-red-500">
                      {duplicateErrors.studentId}
                    </p>
                  )}
                  {newEntryInfo.studentId && (
                    <p className="text-sm text-green-500">
                      {newEntryInfo.studentId}
                    </p>
                  )}
                </>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={participantData.name}
                onChange={(e) => {
                  const formattedName = capitalizeWords(e.target.value);
                  handleInputChange("name", e.target.value);
                  setParticipantData({
                    ...participantData,
                    name: formattedName,
                  });
                  setDuplicateErrors("");
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
                  <SelectItem value="Intersex">Intersex</SelectItem>
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
                <p className="text-sm text-red-500">{errors.homeAddress}</p>
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
      <AlertDialog
        open={showAutoFillDialog}
        onOpenChange={setShowAutoFillDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Participant Found</AlertDialogTitle>
            <AlertDialogDescription>
              A participant with this student ID was found. Would you like to
              auto-fill their information?
              {foundParticipant && (
                <div className="mt-4 p-4 bg-muted rounded-lg">
                  <p>
                    <strong>Name:</strong> {foundParticipant.name}
                  </p>
                  <p>
                    <strong>School:</strong> {foundParticipant.school}
                  </p>
                  <p>
                    <strong>Year:</strong> {foundParticipant.year}
                  </p>
                  <p>
                    <strong>Section:</strong> {foundParticipant.section}
                  </p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setShowAutoFillDialog(false);
                setFoundParticipant(null);
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleAutoFillConfirm}>
              Auto-fill Information
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
