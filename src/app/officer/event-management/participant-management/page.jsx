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
  formatStaffFacultyId,
  getInitialParticipantData,
  cleanParticipantData,
  handleParticipantTypeChange,
  handleInputChange,
  updateParticipantCounts,
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

  const onParticipantTypeChange = (type) => {
    handleParticipantTypeChange(
      type,
      setParticipantType,
      setParticipantData,
      setErrors
    );
  };

  const onInputChange = async (field, value) => {
    await handleInputChange(
      field,
      value,
      participantData,
      setParticipantData,
      currentEventId,
      setDuplicateErrors,
      setNewEntryInfo,
      setAutofillData,
      setShowAutofillDialog
    );
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
        school: autofillData.school || "",
        position: autofillData.position || "",
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
      staffFacultyId: participantType === "staff" ? "" : undefined,
    });
  }, [participantType]);

  const renderCommonFields = () => (
    <>
      <div className="grid w-full items-center gap-1.5">
        <Label htmlFor="name">Name</Label>
        <Input
          type="text"
          id="name"
          placeholder="Enter full name"
          value={participantData.name}
          onChange={(e) =>
            setParticipantData({
              ...participantData,
              name: capitalizeWords(e.target.value),
            })
          }
        />
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
              type="text"
              id="studentId"
              placeholder="Enter student ID"
              value={participantData.studentId}
              onChange={(e) => {
                const formattedId = formatStudentId(e.target.value);
                setParticipantData({
                  ...participantData,
                  studentId: formattedId,
                });
              }}
            />
          </div>
        );

      case "staff":
        return (
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="staffFacultyId">Staff/Faculty ID</Label>
            <Input
              type="text"
              id="staffFacultyId"
              placeholder="Enter staff/faculty ID"
              value={participantData.staffFacultyId}
              onChange={(e) => {
                const formattedId = formatStaffFacultyId(e.target.value);
                setParticipantData({
                  ...participantData,
                  staffFacultyId: formattedId,
                });
              }}
              maxLength={3}
            />
          </div>
        );

      case "community":
        return null; // No additional fields for community members
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
