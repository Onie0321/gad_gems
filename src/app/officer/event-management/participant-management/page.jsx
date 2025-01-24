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
import { Loader2, HelpCircle, Edit, Trash2, Plus } from "lucide-react";
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
  formatStaffFacultyId,
  getInitialParticipantData,
  cleanParticipantData,
  handleParticipantTypeChange,
  handleInputChange,
  updateParticipantCounts,
  isIdComplete,
  handleAutofillConfirm,
} from "@/utils/participantUtils";
import {
  createParticipant,
  getCurrentUser,
  checkDuplicateParticipant,
  databases,
  databaseId,
  participantCollectionId,
  eventCollectionId,
  staffFacultyCollectionId,
  communityCollectionId,
} from "@/lib/appwrite";
import EditParticipantDialog from "./edit-participant-dialog/page";
import DeleteParticipantDialog from "./delete-participant-dialog/page";
import { debounce } from "lodash";
import { usePathname, useRouter } from "next/navigation";
import ParticipantTypeSelector from "./participant-type-selector/page";
import { ID } from "appwrite";
import DataTable from "../../demographic-analysis/data-table/page";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ParticipantTables from "./participant-tables/page";
import {
  saveFormData,
  loadFormData,
  clearFormData,
  STORAGE_KEYS,
} from "@/utils/formPersistence";
import { Query } from "appwrite";
import ImportEventData from "../event-participant-log/import-event/page";
import { LoadingAnimation } from "@/components/loading/loading-animation";

export default function ParticipantManagement({
  events,
  currentEventId,
  setCurrentEventId,
  user,
  setActiveTab,
}) {
  const [participantData, setParticipantData] = useState(
    getInitialParticipantData("student")
  );
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
  const [activeSection, setActiveSection] = useState(null);
  const [validationMessages, setValidationMessages] = useState({
    student: {
      studentId: "",
      name: "",
    },
    staff: {
      staffFacultyId: "",
      name: "",
    },
    community: {
      name: "",
    },
  });
  const [hasDuplicates, setHasDuplicates] = useState(false);

  const currentEvent = events.find((e) => e.$id === currentEventId);
  const isEventSelected = !!currentEvent;

  useEffect(() => {
    updateParticipantCounts(
      participants,
      currentEventId,
      setTotalParticipants,
      setTotalMaleParticipants,
      setTotalFemaleParticipants
    );
  }, [participants, currentEventId]);

  const handleParticipantTypeChange = (type) => {
    setParticipantType(type);
    setParticipantData(getInitialParticipantData(type));
    setErrors({});
    setDuplicateErrors({});
    setNewEntryInfo({});
    setActiveSection(type);

    // Scroll to the selected section
    const sectionElement = document.getElementById(`${type}-section`);
    if (sectionElement) {
      sectionElement.scrollIntoView({ behavior: "smooth" });
    }
  };

  const onInputChange = async (field, value) => {
    try {
      const updatedData = { ...participantData, [field]: value };
      setParticipantData(updatedData);

      // Determine which identifier to check based on participant type
      const identifierField =
        participantType === "student"
          ? "studentId"
          : participantType === "staff"
          ? "staffFacultyId"
          : "name";

      if (field === identifierField) {
        // Check if the value is valid for checking
        const isValid =
          participantType === "community"
            ? value.length >= 3
            : isIdComplete(value, participantType);

        if (!isValid) {
          setDuplicateErrors({});
          return;
        }

        // Check for existing participant
        const existingParticipant = participants.find(
          (p) =>
            p[identifierField]?.toLowerCase() === value.toLowerCase() &&
            p.eventId !== currentEventId
        );

        console.log("Checking for existing participant:", {
          field,
          value,
          existingParticipant,
        });

        if (existingParticipant) {
          setAutofillData({
            ...existingParticipant,
            eventName: existingParticipant.eventName || "another event",
            participantType,
          });
          setShowConfirmDialog(true);
        }
      }
    } catch (error) {
      console.error("Error in handleInputChange:", error);
    }
  };

  const handleAddParticipant = async (e) => {
    e.preventDefault();
    console.log(
      "Starting participant submission:",
      participantData,
      participantType
    );

    try {
      const validationErrors = validateParticipantForm(
        participantData,
        participantType
      );
      if (validationErrors) {
        setErrors(validationErrors);
        toast.error("Please fill in all required fields.");
        return;
      }

      if (!currentEvent) {
        toast.error("No event selected");
        return;
      }

      setLoading(true);
      let createdParticipant;
      let participantReference;

      // Clean the data based on participant type
      const cleanedData = {
        ...cleanParticipantData(participantData, participantType),
        eventId: currentEventId,
      };

      console.log("Cleaned data for submission:", cleanedData);

      switch (participantType) {
        case "student":
          createdParticipant = await databases.createDocument(
            databaseId,
            participantCollectionId,
            ID.unique(),
            {
              studentId: cleanedData.studentId,
              name: cleanedData.name,
              sex: cleanedData.sex,
              age: parseInt(cleanedData.age),
              homeAddress: cleanedData.homeAddress,
              school: cleanedData.school,
              year: cleanedData.year,
              section: cleanedData.section,
              ethnicGroup: cleanedData.ethnicGroup,
              eventId: cleanedData.eventId,
              createdBy: user.$id,
            }
          );
          participantReference = `student_${createdParticipant.$id}`;
          break;

        case "staff":
          createdParticipant = await databases.createDocument(
            databaseId,
            staffFacultyCollectionId,
            ID.unique(),
            {
              staffFacultyId: cleanedData.staffFacultyId,
              name: cleanedData.name,
              age: parseInt(cleanedData.age),
              sex: cleanedData.sex,
              address: cleanedData.address,
              ethnicGroup: cleanedData.ethnicGroup,
              eventId: cleanedData.eventId,
            }
          );
          participantReference = `staff_${createdParticipant.$id}`;
          break;

        case "community":
          createdParticipant = await databases.createDocument(
            databaseId,
            communityCollectionId,
            ID.unique(),
            {
              name: cleanedData.name,
              age: parseInt(cleanedData.age),
              sex: cleanedData.sex,
              address: cleanedData.address,
              ethnicGroup: cleanedData.ethnicGroup,
              eventId: cleanedData.eventId,
            }
          );
          participantReference = `community_${createdParticipant.$id}`;
          break;
      }

      if (createdParticipant) {
        // Update event participants
        const updatedParticipants = [
          ...(currentEvent.participants || []),
          participantReference,
        ];

        await databases.updateDocument(
          databaseId,
          eventCollectionId,
          currentEventId,
          { participants: updatedParticipants }
        );

        setParticipants((prev) => [...prev, createdParticipant]);
        setHasAddedParticipants(true);

        // Reset form with correct initial state
        setParticipantData(getInitialParticipantData(participantType));
        setErrors({});

        toast.success(
          `${
            participantType.charAt(0).toUpperCase() + participantType.slice(1)
          } ${cleanedData.name} added successfully`
        );
      }

      // Clear saved form data only after successful submission
      clearFormData(STORAGE_KEYS.PARTICIPANT);
    } catch (error) {
      console.error("Error adding participant:", error);
      toast.error(`Error adding participant: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleFinishAddingParticipants = async () => {
    try {
      // Get the current event with its participants
      const event = await databases.getDocument(
        databaseId,
        eventCollectionId,
        currentEventId
      );

      // Count participants by type
      const participantCounts = event.participants.reduce((acc, ref) => {
        const [type] = ref.split("_");
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {});

      // Create detailed summary message
      const summaryMessage = `Event "${event.eventName}" completed!\n
      ${
        participantCounts.student
          ? `Students: ${participantCounts.student}\n`
          : ""
      }
      ${
        participantCounts.staff
          ? `Staff/Faculty: ${participantCounts.staff}\n`
          : ""
      }
      ${
        participantCounts.community
          ? `Community Members: ${participantCounts.community}\n`
          : ""
      }
      Total Participants: ${event.participants.length}`;

      toast.success(summaryMessage, {
        autoClose: 5000,
      });

      // Reset states
      setParticipantData({
        name: "",
        sex: "",
        age: "",
        homeAddress: "",
        studentId: "",
        school: "",
        year: "",
        section: "",
        ethnicGroup: "",
        otherEthnicGroup: "",
        staffFacultyId: "",
      });

      setParticipants([]);
      setCurrentEventId(null);
      setHasAddedParticipants(false);
      setActiveTab("overview");
    } catch (error) {
      console.error("Error finishing event:", error);
      toast.error("Error completing event participants");
    }
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

  const handleStudentIdChange = async (e) => {
    const value = formatStudentId(e.target.value);
    setParticipantData((prev) => ({ ...prev, studentId: value }));

    // Only show validation for student type
    if (participantType !== "student") return;

    // Clear validation message if empty
    if (!value.trim()) {
      setValidationMessages((prev) => ({
        ...prev,
        student: {
          ...prev.student,
          studentId: "",
        },
      }));
      setHasDuplicates(false);
      return;
    }

    // Only check for duplicates if we have a complete student ID
    if (value.length === 10 && value.match(/^\d{2}-\d{2}-\d{4}$/)) {
      await checkDuplicateInCurrentEvent("studentId", value);
    }
  };

  const handleStaffIdChange = async (e) => {
    const value = formatStaffFacultyId(e.target.value);
    setParticipantData((prev) => ({ ...prev, staffFacultyId: value }));

    // Only show validation for staff type
    if (participantType !== "staff") return;

    // Clear validation message if empty
    if (!value.trim()) {
      setValidationMessages((prev) => ({
        ...prev,
        staff: {
          ...prev.staff,
          staffFacultyId: "",
        },
      }));
      setHasDuplicates(false);
      return;
    }

    // Check for duplicates if we have a complete staff ID
    if (value.length >= 3) {
      await checkDuplicateInCurrentEvent("staffFacultyId", value);
    }
  };

  const handleNameChange = async (e) => {
    const value = capitalizeWords(e.target.value);
    setParticipantData((prev) => ({ ...prev, name: value }));

    // Clear validation message if empty
    if (!value.trim()) {
      setValidationMessages((prev) => ({
        ...prev,
        [participantType]: {
          ...prev[participantType],
          name: "",
        },
      }));
      setHasDuplicates(false);
      return;
    }

    // Only validate name based on participant type
    switch (participantType) {
      case "student":
        if (value.trim()) {
          await checkDuplicateInCurrentEvent("name", value);
        }
        break;
      case "staff":
        if (value.trim()) {
          await checkDuplicateInCurrentEvent("name", value);
        }
        break;
      case "community":
        if (value.trim()) {
          await checkDuplicateInCurrentEvent("name", value);
        }
        break;
      default:
        break;
    }
  };

  const handleInitialConfirm = () => {
    console.log("Initial confirm clicked, autofill data:", autofillData);
    setShowConfirmDialog(false);
    setShowDetailsDialog(true);
  };

  const handleAutofillConfirmation = () => {
    console.log("Autofill confirmation clicked, data:", autofillData);
    if (autofillData) {
      const mappedData = {
        name: autofillData.name,
        sex: autofillData.sex,
        age: autofillData.age,
        homeAddress: autofillData.homeAddress || autofillData.address,
        ethnicGroup: autofillData.ethnicGroup,
        otherEthnicGroup: autofillData.otherEthnicGroup || "",
      };

      // Add type-specific fields
      if (participantType === "student") {
        mappedData.studentId = autofillData.studentId;
        mappedData.school = autofillData.school;
        mappedData.year = autofillData.year;
        mappedData.section = autofillData.section;
      } else if (participantType === "staff") {
        mappedData.staffFacultyId = autofillData.staffFacultyId;
      }

      console.log("Setting participant data:", mappedData);
      setParticipantData(mappedData);
      setShowDetailsDialog(false);
      setAutofillData(null);
    }
  };

  const handleCancel = () => {
    console.log("Cancel clicked");
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
      staffFacultyId: participantType === "staff" ? "" : undefined,
    });
  }, [participantType]);

  const renderCommonFields = () => (
    <>
      <div className="grid w-full items-center gap-1.5">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          value={participantData.name || ""}
          onChange={handleNameChange}
          placeholder="Enter full name"
        />
        {validationMessages[participantType].name && (
          <p
            className={`text-sm ${
              validationMessages[participantType].name.includes("already")
                ? "text-red-500"
                : "text-green-500"
            }`}
          >
            {validationMessages[participantType].name}
          </p>
        )}
      </div>
      <div className="grid w-full items-center gap-1.5">
        <Label htmlFor="sex">Sex at Birth</Label>
        <Select
          value={participantData.sex}
          onValueChange={(value) =>
            setParticipantData({ ...participantData, sex: value })
          }
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
      <div className="grid w-full items-center gap-1.5">
        <Label htmlFor="age">Age</Label>
        <Input
          type="number"
          id="age"
          placeholder="Enter age"
          value={participantData.age}
          onChange={(e) =>
            setParticipantData({ ...participantData, age: e.target.value })
          }
        />
      </div>
      <div className="grid w-full items-center gap-1.5">
        <Label htmlFor="homeAddress">Home Address</Label>
        <Input
          type="text"
          id="homeAddress"
          placeholder="Enter home address"
          value={participantData.homeAddress}
          onChange={(e) =>
            setParticipantData({
              ...participantData,
              homeAddress: capitalizeWords(e.target.value),
            })
          }
        />
      </div>
    </>
  );

  const renderStudentFields = () => (
    <>
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
                participantData.school ? "Select year" : "Select school first"
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
        {errors.year && <p className="text-sm text-red-500">{errors.year}</p>}
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
    </>
  );

  const renderParticipantTypeFields = () => {
    switch (participantType) {
      case "student":
        return (
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="studentId">Student ID</Label>
            <Input
              id="studentId"
              value={participantData.studentId || ""}
              onChange={handleStudentIdChange}
              placeholder="XX-XX-XXXX"
            />
            {validationMessages[participantType].studentId && (
              <p
                className={`text-sm ${
                  validationMessages[participantType].studentId.includes(
                    "already"
                  )
                    ? "text-red-500"
                    : "text-green-500"
                }`}
              >
                {validationMessages[participantType].studentId}
              </p>
            )}
          </div>
        );

      case "staff":
        return (
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="staffFacultyId">Staff/Faculty ID</Label>
            <Input
              id="staffFacultyId"
              value={participantData.staffFacultyId || ""}
              onChange={handleStaffIdChange}
              placeholder="XXX"
            />
            {validationMessages[participantType].staffFacultyId && (
              <p
                className={`text-sm ${
                  validationMessages[participantType].staffFacultyId.includes(
                    "already"
                  )
                    ? "text-red-500"
                    : "text-green-500"
                }`}
              >
                {validationMessages[participantType].staffFacultyId}
              </p>
            )}
          </div>
        );

      case "community":
        return null; // No additional fields for community members

      default:
        return null;
    }
  };

  const renderEthnicGroupFields = () => (
    <>
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
            <p className="text-sm text-red-500">{errors.otherEthnicGroup}</p>
          )}
        </div>
      )}
    </>
  );

  // Add this component for the statistics card
  const StatisticsCard = ({ participants }) => {
    const stats = participants.reduce((acc, p) => {
      const type =
        p.type ||
        (p.studentId ? "student" : p.staffFacultyId ? "staff" : "community");
      const sex = p.sex;

      if (!acc[type]) {
        acc[type] = { total: 0, male: 0, female: 0 };
      }

      acc[type].total++;
      if (sex === "Male") acc[type].male++;
      if (sex === "Female") acc[type].female++;

      return acc;
    }, {});

    return (
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Participant Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <h3 className="font-semibold">Students</h3>
              <p>Total: {stats.student?.total || 0}</p>
              <p>Male: {stats.student?.male || 0}</p>
              <p>Female: {stats.student?.female || 0}</p>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold">Staff/Faculty</h3>
              <p>Total: {stats.staff?.total || 0}</p>
              <p>Male: {stats.staff?.male || 0}</p>
              <p>Female: {stats.staff?.female || 0}</p>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold">Community</h3>
              <p>Total: {stats.community?.total || 0}</p>
              <p>Male: {stats.community?.male || 0}</p>
              <p>Female: {stats.community?.female || 0}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Add these column definitions before the return statement
  const studentColumns = [
    {
      accessorKey: "studentId",
      header: "Student ID",
    },
    {
      accessorKey: "name",
      header: "Name",
    },
    {
      accessorKey: "sex",
      header: "Sex",
    },
    {
      accessorKey: "age",
      header: "Age",
    },
    {
      accessorKey: "homeAddress",
      header: "Address",
    },
    {
      accessorKey: "school",
      header: "School",
    },
    {
      accessorKey: "year",
      header: "Year",
    },
    {
      accessorKey: "section",
      header: "Section",
    },
    {
      accessorKey: "ethnicGroup",
      header: "Ethnic Group",
    },
  ];

  const staffColumns = [
    {
      accessorKey: "staffFacultyId",
      header: "Staff/Faculty ID",
    },
    {
      accessorKey: "name",
      header: "Name",
    },
    {
      accessorKey: "sex",
      header: "Sex",
    },
    {
      accessorKey: "age",
      header: "Age",
    },
    {
      accessorKey: "homeAddress",
      header: "Address",
    },
    {
      accessorKey: "ethnicGroup",
      header: "Ethnic Group",
    },
  ];

  const communityColumns = [
    {
      accessorKey: "name",
      header: "Name",
    },
    {
      accessorKey: "sex",
      header: "Sex",
    },
    {
      accessorKey: "age",
      header: "Age",
    },
    {
      accessorKey: "homeAddress",
      header: "Address",
    },
    {
      accessorKey: "ethnicGroup",
      header: "Ethnic Group",
    },
  ];

  const resetForm = () => {
    setParticipantData({
      name: "",
      sex: "",
      age: "",
      homeAddress: "",
      studentId: "",
      school: "",
      year: "",
      section: "",
      ethnicGroup: "",
      otherEthnicGroup: "",
      staffFacultyId: "",
    });
    setErrors({});
  };

  // Load saved form data on component mount
  useEffect(() => {
    const savedData = loadFormData(STORAGE_KEYS.PARTICIPANT);
    if (savedData) {
      setParticipantData(savedData.participantData || {});
      setParticipantType(savedData.participantType || "student");
      // Load any other relevant saved data
    }
  }, []);

  // Save form data on any change
  useEffect(() => {
    const formData = {
      participantData,
      participantType,
      // Include any other state that needs to be persisted
    };
    saveFormData(STORAGE_KEYS.PARTICIPANT, formData);
  }, [participantData, participantType]);

  const renderAutofillDialog = () => {
    return (
      <>
        <AlertDialog
          open={showConfirmDialog}
          onOpenChange={setShowConfirmDialog}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Existing Participant Found</AlertDialogTitle>
              <AlertDialogDescription>
                A {participantType} with this {getIdentifierType()} was found in
                another event. Would you like to see their details and
                potentially autofill the form?
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

        <AlertDialog
          open={showDetailsDialog}
          onOpenChange={setShowDetailsDialog}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Participant Details</AlertDialogTitle>
              <AlertDialogDescription>
                {autofillData && (
                  <div className="space-y-4">
                    <p>Participant data found from {autofillData.eventName}:</p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {renderAutofillFields()}
                    </div>
                    <p className="mt-2">
                      Would you like to autofill the form with this data?
                    </p>
                  </div>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={handleCancel}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction onClick={handleAutofillConfirmation}>
                Yes, Autofill
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    );
  };

  const getIdentifierType = () => {
    switch (participantType) {
      case "student":
        return "Student ID";
      case "staff":
        return "Staff/Faculty ID";
      case "community":
        return "name";
      default:
        return "identifier";
    }
  };

  const renderAutofillFields = () => {
    if (!autofillData) {
      console.log("No autofill data available");
      return null;
    }

    console.log("Rendering autofill fields with data:", autofillData);

    const commonFields = [
      { label: "Name", value: autofillData.name },
      { label: "Sex", value: autofillData.sex },
      { label: "Age", value: autofillData.age },
      {
        label: "Address",
        value: autofillData.homeAddress || autofillData.address,
      },
      { label: "Ethnic Group", value: autofillData.ethnicGroup },
    ];

    const typeSpecificFields =
      participantType === "student"
        ? [
            { label: "Student ID", value: autofillData.studentId },
            { label: "School", value: autofillData.school },
            { label: "Year", value: autofillData.year },
            { label: "Section", value: autofillData.section },
          ]
        : participantType === "staff"
        ? [{ label: "Staff/Faculty ID", value: autofillData.staffFacultyId }]
        : [];

    const fieldsToRender = [...commonFields, ...typeSpecificFields];

    return fieldsToRender.map(({ label, value }) => (
      <div key={label} className="flex justify-between">
        <strong>{label}:</strong>
        <span>{value || "N/A"}</span>
      </div>
    ));
  };

  // Add these console logs for debugging
  useEffect(() => {
    console.log("Participants state updated:", participants);
  }, [participants]);

  useEffect(() => {
    console.log("Dialog states updated:", {
      showConfirmDialog,
      showDetailsDialog,
      autofillData,
    });
  }, [showConfirmDialog, showDetailsDialog, autofillData]);

  const checkDuplicateInCurrentEvent = async (field, value) => {
    if (!value || !currentEventId) return false;

    try {
      let isDuplicate = false;
      const collectionId =
        participantType === "student"
          ? participantCollectionId
          : participantType === "staff"
          ? staffFacultyCollectionId
          : communityCollectionId;

      const query = [Query.equal("eventId", currentEventId)];

      if (field === "studentId") {
        query.push(Query.equal("studentId", value.toLowerCase()));
      } else if (field === "staffFacultyId") {
        query.push(Query.equal("staffFacultyId", value.toLowerCase()));
      } else if (field === "name") {
        query.push(Query.equal("name", value.toLowerCase()));
      }

      const response = await databases.listDocuments(
        databaseId,
        collectionId,
        query
      );

      isDuplicate = response.documents.length > 0;

      if (isDuplicate) {
        setValidationMessages((prev) => ({
          ...prev,
          [participantType]: {
            ...prev[participantType],
            [field]: getValidationMessage(participantType, field, true),
          },
        }));
        setHasDuplicates(true);
        return true;
      } else {
        setValidationMessages((prev) => ({
          ...prev,
          [participantType]: {
            ...prev[participantType],
            [field]: getValidationMessage(participantType, field, false),
          },
        }));
        setHasDuplicates(false);
        return false;
      }
    } catch (error) {
      console.error("Error checking duplicate:", error);
      setValidationMessages((prev) => ({
        ...prev,
        [participantType]: {
          ...prev[participantType],
          [field]: "Error checking participant information",
        },
      }));
      return false;
    }
  };

  // Helper function to get the appropriate validation message
  const getValidationMessage = (type, field, isDuplicate) => {
    if (isDuplicate) {
      switch (type) {
        case "student":
          return field === "studentId"
            ? "This Student ID is already registered in this event"
            : "This student name is already registered in this event";
        case "staff":
          return field === "staffFacultyId"
            ? "This Staff/Faculty ID is already registered in this event"
            : "This staff/faculty name is already registered in this event";
        case "community":
          return "This community member name is already registered in this event";
      }
    } else {
      switch (type) {
        case "student":
          return field === "studentId"
            ? "This is a new Student ID"
            : "This is a new student name";
        case "staff":
          return field === "staffFacultyId"
            ? "This is a new Staff/Faculty ID"
            : "This is a new staff/faculty name";
        case "community":
          return "This is a new community member name";
      }
    }
  };

  // Add this function before the main return statement
  const renderEmptyState = () => {
    return (
      <Card className="w-full">
        <CardHeader className="text-center">
          <CardTitle>No Events Available</CardTitle>
          <CardDescription>
            There are no events in the current academic period
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          <Button onClick={() => setActiveTab("createEvent")}>
            <Plus className="mr-2 h-4 w-4" /> Create Your First Event
          </Button>
          <div className="flex items-center gap-2">
            <div className="h-px w-16 bg-gray-300" />
            <span className="text-sm text-gray-500">or</span>
            <div className="h-px w-16 bg-gray-300" />
          </div>
          <ImportEventData />
        </CardContent>
      </Card>
    );
  };

  // Update the empty state check
  if (loading) {
    return <LoadingAnimation message="Loading participants..." />;
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

  if (events.length === 0) {
    return renderEmptyState();
  }

  return (
    <>
      {renderAutofillDialog()}

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
              {renderParticipantTypeFields()}
              {renderCommonFields()}
              {participantType === "student" && renderStudentFields()}
              {renderEthnicGroupFields()}
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
        {isEventSelected && (
          <ParticipantTables
            participants={participants}
            onUpdateParticipant={handleUpdateParticipant}
            onDeleteParticipant={handleDeleteParticipant}
          />
        )}
      </Card>
    </>
  );
}
