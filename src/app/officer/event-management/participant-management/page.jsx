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
import {
  Loader2,
  HelpCircle,
  Edit,
  Trash2,
  Plus,
  Users,
  GraduationCap,
  UsersRound,
} from "lucide-react";
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
  requiredFields,
} from "@/utils/participantUtils";
import {
  createParticipant,
  getCurrentUser,
  checkDuplicateParticipant,
  databases,
  databaseId,
  studentsCollectionId,
  eventCollectionId,
  staffFacultyCollectionId,
  communityCollectionId,
  updateParticipant,
} from "@/lib/appwrite";
import { usePathname, useRouter } from "next/navigation";
import { ID } from "appwrite";
import ParticipantTables from "./participant-tables/page";
import {
  saveFormData,
  loadFormData,
  clearFormData,
  STORAGE_KEYS,
} from "@/utils/formPersistence";
import { Query } from "appwrite";
import { debounce } from "lodash";
import { cn } from "@/lib/utils";
import { ColorfulSpinner } from "@/components/ui/loader";
import { NetworkStatus } from "@/components/ui/network-status";
import EditParticipantDialog from "./edit-participant-dialog/page";

// Move initialParticipantData outside the component
const initialParticipantData = {
  name: "",
  sex: "",
  age: "",
  address: "",
  studentId: "",
  school: "",
  year: "",
  section: "",
  ethnicGroup: "",
  otherEthnicGroup: "",
  staffFacultyId: "",
};

// First, add this constant at the top of your file with other imports
const ethnicGroups = [
  "Tagalog",
  "Cebuano",
  "Ilocano",
  "Bicolano",
  "Waray",
  "Kapampangan",
  "Pangasinan",
  "Ilonggo",
  "Other",
];

export default function ParticipantManagement({
  events,
  currentEventId,
  setCurrentEventId,
  currentEvent,
  setCurrentEvent,
  user,
  setActiveTab,
  networkStatus,
  currentAcademicPeriod,
  activeTab,
}) {
  // Add getGenderCounts function at the top
  const getGenderCounts = (type) => {
    const filteredParticipants =
      type === "student"
        ? participants.filter((p) => p.studentId)
        : type === "staff"
        ? participants.filter((p) => p.staffFacultyId)
        : participants.filter((p) => !p.studentId && !p.staffFacultyId);

    return {
      male: filteredParticipants.filter((p) => p.sex === "Male").length,
      female: filteredParticipants.filter((p) => p.sex === "Female").length,
    };
  };

  // 1. All useState hooks
  const [participantData, setParticipantData] = useState(
    initialParticipantData
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
  const [isEventSelected, setIsEventSelected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [tabCounts, setTabCounts] = useState({
    student: 0,
    staff: 0,
    community: 0,
  });
  const [successMessage, setSuccessMessage] = useState("");
  const [error, setError] = useState(null);

  // 2. useCallback hooks
  const updateTabCounts = useCallback(() => {
    if (!participants) return;
    const counts = participants.reduce(
      (acc, participant) => {
        const type =
          participant.participantType?.toLowerCase() ||
          participant.type?.toLowerCase();
        if (type === "student") acc.student++;
        else if (type === "staff" || type === "staff/faculty") acc.staff++;
        else if (type === "community" || type === "community member")
          acc.community++;
        return acc;
      },
      { student: 0, staff: 0, community: 0 }
    );
    setTabCounts(counts);
  }, [participants]);

  const fetchParticipants = useCallback(async (eventId) => {
    try {
      // Fetch participants from all collections
      const [studentsResponse, staffResponse, communityResponse] =
        await Promise.all([
          databases.listDocuments(databaseId, studentsCollectionId, [
            Query.equal("eventId", eventId),
          ]),
          databases.listDocuments(databaseId, staffFacultyCollectionId, [
            Query.equal("eventId", eventId),
          ]),
          databases.listDocuments(databaseId, communityCollectionId, [
            Query.equal("eventId", eventId),
          ]),
        ]);

      // Combine all participants with their types
      const allParticipants = [
        ...studentsResponse.documents.map((p) => ({ ...p, type: "student" })),
        ...staffResponse.documents.map((p) => ({ ...p, type: "staff" })),
        ...communityResponse.documents.map((p) => ({
          ...p,
          type: "community",
        })),
      ];

      setParticipants(allParticipants);

      // Update counts
      const counts = allParticipants.reduce(
        (acc, p) => {
          if (p.sex === "Male") acc.male++;
          if (p.sex === "Female") acc.female++;
          acc.total++;
          return acc;
        },
        { male: 0, female: 0, total: 0 }
      );

      setTotalParticipants(counts.total);
      setTotalMaleParticipants(counts.male);
      setTotalFemaleParticipants(counts.female);
    } catch (error) {
      console.error("Error fetching participants:", error);
      toast.error("Failed to load participants");
      setError("Failed to load participants");
    }
  }, []);

  // 3. useEffect hooks
  useEffect(() => {
    const initializeComponent = async () => {
      try {
        setIsLoading(true);

        if (!events || events.length === 0) {
          setIsEventSelected(false);
          setCurrentEvent(null);
          return;
        }

        if (currentEventId) {
          const event = events.find((e) => e.$id === currentEventId);
          if (event) {
            setCurrentEvent(event);
            setIsEventSelected(true);
            await fetchParticipants(event.$id);
          }
        } else if (events.length > 0) {
          const firstEvent = events[0];
          setCurrentEventId(firstEvent.$id);
          setCurrentEvent(firstEvent);
          setIsEventSelected(true);
          await fetchParticipants(firstEvent.$id);
        }
      } catch (error) {
        console.error("Error initializing component:", error);
        toast.error("Failed to load event data");
        setError("Failed to load event data");
      } finally {
        setIsLoading(false);
      }
    };

    initializeComponent();
  }, [
    events,
    currentEventId,
    setCurrentEvent,
    setCurrentEventId,
    fetchParticipants,
  ]);

  useEffect(() => {
    updateTabCounts();
  }, [participants, updateTabCounts]);

  // Add this useEffect to handle automatic event selection after creation
  useEffect(() => {
    if (currentEventId && events.length > 0) {
      const event = events.find((e) => e.$id === currentEventId);
      if (event) {
        setCurrentEvent(event);
        setIsEventSelected(true);
      }
    }
  }, [currentEventId, events]);

  // Add these functions before the renderContent function

  const handleParticipantTypeChange = (type) => {
    setParticipantType(type);
    setParticipantData(getInitialParticipantData(type));
    setErrors({});
    setDuplicateErrors({ studentId: "", name: "" });
  };

  const isValidEvent = (event) => {
    return event && event.$id;
  };

  const renderAutofillDialog = () => {
    if (!showAutofillDialog || !autofillData) return null;

    return (
      <AlertDialog
        open={showAutofillDialog}
        onOpenChange={setShowAutofillDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Existing Participant Found</AlertDialogTitle>
            <AlertDialogDescription>
              A participant with this ID already exists in our database. Would
              you like to use their information?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <div className="space-y-2">
              <p>
                <strong>Name:</strong> {autofillData.name}
              </p>
              <p>
                <strong>Sex:</strong> {autofillData.sex}
              </p>
              <p>
                <strong>Age:</strong> {autofillData.age}
              </p>
              <p>
                <strong>Address:</strong> {autofillData.address}
              </p>
              {autofillData.studentId && (
                <>
                  <p>
                    <strong>Student ID:</strong> {autofillData.studentId}
                  </p>
                  <p>
                    <strong>School:</strong> {autofillData.school}
                  </p>
                  <p>
                    <strong>Year:</strong> {autofillData.year}
                  </p>
                  <p>
                    <strong>Section:</strong> {autofillData.section}
                  </p>
                </>
              )}
              {autofillData.staffFacultyId && (
                <p>
                  <strong>Staff/Faculty ID:</strong>{" "}
                  {autofillData.staffFacultyId}
                </p>
              )}
              <p>
                <strong>Ethnic Group:</strong> {autofillData.ethnicGroup}
              </p>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setShowAutofillDialog(false);
                setAutofillData(null);
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                handleAutofillConfirm(autofillData, setParticipantData);
                setShowAutofillDialog(false);
                setAutofillData(null);
              }}
            >
              Use Information
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  };

  const handleAddParticipant = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log("Raw form data:", participantData);
      console.log("Participant type:", participantType);
      console.log(
        "staffFacultyId before cleaning:",
        participantData.staffFacultyId
      );

      const cleanedData = cleanParticipantData(
        participantData,
        participantType
      );
      console.log("Cleaned data:", cleanedData);
      console.log("staffFacultyId after cleaning:", cleanedData.staffFacultyId);

      const validationErrors = validateParticipantForm(
        cleanedData,
        participantType
      );
      console.log("Validation errors:", validationErrors);

      if (Object.keys(validationErrors).length > 0) {
        console.log(
          "Validation failed. Required fields missing:",
          validationErrors
        );
        setErrors(validationErrors);
        toast.error("Please fill in all required fields");
        setLoading(false);
        return;
      }

      // Prepare the base participant data with only fields that exist in the schema
      const baseParticipantData = {
        // User input fields
        name: cleanedData.name,
        age: parseInt(cleanedData.age),
        sex: cleanedData.sex,
        address: cleanedData.address,
        ethnicGroup: cleanedData.ethnicGroup,
        otherEthnicGroup: cleanedData.otherEthnicGroup || "",

        // System-generated fields
        eventId: currentEventId,
        createdBy: user.$id,
        participantType: participantType,
        academicPeriodId: currentEvent?.academicPeriodId || "",
        isArchived: false,
      };

      console.log("Base participant data:", baseParticipantData);

      // Determine which collection to use and add type-specific fields
      let collectionId;
      let participantToAdd;

      switch (participantType) {
        case "student":
          collectionId = studentsCollectionId;
          participantToAdd = {
            ...baseParticipantData,
            studentId: cleanedData.studentId || "",
            school: cleanedData.school || "",
            year: cleanedData.year || "",
            section: cleanedData.section || "",
          };
          break;

        case "staff":
          collectionId = staffFacultyCollectionId;
          participantToAdd = {
            ...baseParticipantData,
            staffFacultyId: cleanedData.staffFacultyId,
          };
          break;

        case "community":
          collectionId = communityCollectionId;
          participantToAdd = baseParticipantData;
          break;

        default:
          throw new Error("Invalid participant type");
      }

      console.log("Final participant data to add:", participantToAdd);
      console.log("Using collection ID:", collectionId);

      // Create the participant document
      const participantId = ID.unique();
      const response = await databases.createDocument(
        databaseId,
        collectionId,
        participantId,
        participantToAdd
      );

      if (response) {
        // Format the participant ID with type prefix
        const formattedParticipantId = `${participantType}_${participantId}`;

        // Get current event
        const event = await databases.getDocument(
          databaseId,
          eventCollectionId,
          currentEventId
        );

        // Update event's participants array
        await databases.updateDocument(
          databaseId,
          eventCollectionId,
          currentEventId,
          {
            participants: [...(event.participants || []), formattedParticipantId]
          }
        );

        toast.success("Participant added successfully!");
        setParticipantData(getInitialParticipantData(participantType));
        setErrors({});
        await fetchParticipants(currentEventId);

        // Scroll to the tables section
        const tablesSection = document.querySelector("#participant-tables");
        if (tablesSection) {
          tablesSection.scrollIntoView({ behavior: "smooth" });
        }

        // Find and click the appropriate TabsTrigger based on participant type
        const tabValue =
          participantType === "staff"
            ? "staff"
            : participantType === "student"
            ? "students"
            : "community";
        const tabTrigger = document.querySelector(
          `[role="tab"][value="${tabValue}"]`
        );
        if (tabTrigger) {
          tabTrigger.click();
        }
      }
    } catch (error) {
      console.error("Error adding participant:", error);
      console.error("Error details:", {
        message: error.message,
        stack: error.stack,
        data: error.response?.data,
        participantType,
        staffFacultyId: participantData.staffFacultyId,
      });
      toast.error("Failed to add participant. Please try again.");
      setError("Failed to add participant");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateParticipant = async (editedParticipant) => {
    try {
      console.log("Attempting to update participant:", {
        id: editedParticipant.$id,
        updateData: {
          name: editedParticipant.name,
          sex: editedParticipant.sex,
          age: editedParticipant.age,
          school: editedParticipant.school,
          year: editedParticipant.year,
          section: editedParticipant.section,
          ethnicGroup: editedParticipant.ethnicGroup,
          otherEthnicGroup: editedParticipant.otherEthnicGroup,
          eventId: editedParticipant.eventId,
          createdBy: editedParticipant.createdBy,
          academicPeriodId: editedParticipant.academicPeriodId,
          isArchived: editedParticipant.isArchived || false,
          studentId: editedParticipant.studentId,
          homeAddress: editedParticipant.homeAddress,
        },
      });

      let collectionId;
      switch (editedParticipant.type) {
        case "student":
          collectionId = studentsCollectionId;
          break;
        case "staff":
          collectionId = staffFacultyCollectionId;
          break;
        case "community":
          collectionId = communityCollectionId;
          break;
        default:
          throw new Error("Invalid participant type");
      }

      // Keep only the fields we want to update
      const updateData = {
        name: editedParticipant.name,
        sex: editedParticipant.sex,
        age: editedParticipant.age,
        school: editedParticipant.school,
        year: editedParticipant.year,
        section: editedParticipant.section,
        ethnicGroup: editedParticipant.ethnicGroup,
        otherEthnicGroup: editedParticipant.otherEthnicGroup,
        eventId: editedParticipant.eventId,
        createdBy: editedParticipant.createdBy,
        academicPeriodId: editedParticipant.academicPeriodId,
        isArchived: editedParticipant.isArchived || false,
        studentId: editedParticipant.studentId,
        homeAddress: editedParticipant.homeAddress,
      };

      // Update the participant in the database
      const response = await databases.updateDocument(
        databaseId,
        collectionId,
        editedParticipant.$id,
        updateData
      );

      // Update the local state
      setParticipants((prevParticipants) =>
        prevParticipants.map((p) =>
          p.$id === editedParticipant.$id ? response : p
        )
      );

      toast.success("Participant updated successfully");
    } catch (error) {
      console.error("Error updating participant:", {
        error: error.message,
        stack: error.stack,
        participantId: editedParticipant.$id,
        type: editedParticipant.type,
      });
      toast.error("Failed to update participant. Please try again.");
    }
  };

  const handleDeleteParticipant = async (participantId, participantType) => {
    try {
      let collectionId;
      switch (participantType) {
        case "student":
          collectionId = studentsCollectionId;
          break;
        case "staff":
          collectionId = staffFacultyCollectionId;
          break;
        case "community":
          collectionId = communityCollectionId;
          break;
        default:
          throw new Error("Invalid participant type");
      }

      await databases.deleteDocument(databaseId, collectionId, participantId);

      toast.success("Participant deleted successfully!");
      await fetchParticipants(currentEventId);
    } catch (error) {
      console.error("Error deleting participant:", error);
      toast.error("Failed to delete participant");
      setError("Failed to delete participant");
    }
  };

  // Update the handleInputChange function
  const handleInputChange = async (field, value) => {
    let fieldError = "";
    setParticipantData((prev) => ({ ...prev, [field]: value }));
    setSuccessMessage(""); // Clear success message on any input change

    try {
      // Clear previous errors for the field
      setErrors((prev) => ({ ...prev, [field]: "" }));
      setDuplicateErrors((prev) => ({ ...prev, [field]: "" }));

      // Handle ID and name checks based on participant type
      switch (participantType) {
        case "student":
          if (field === "studentId" && value) {
            const formattedId = formatStudentId(value);
            
            // Only show validation error if ID is not in correct format
            const isValidFormat = /^\d{2}-\d{2}-\d{4}$/.test(formattedId);
            
            // Debounced validation for student ID
            const debouncedValidation = debounce(async () => {
              // Only check for duplicates if format is valid
              if (isValidFormat) {
                const { error: idError, participant: existingStudent } =
                  await checkDuplicates(
                    "studentId",
                    formattedId,
                    currentEventId,
                    participantType
                  );

                if (idError) {
                  setDuplicateErrors((prev) => ({ ...prev, studentId: idError }));
                } else if (existingStudent) {
                  setAutofillData(existingStudent);
                  setShowAutofillDialog(true);
                } else {
                  setSuccessMessage("This Student ID is available");
                }
              } else if (value && !isValidFormat) {
                // Only show format error if there's a value and format is invalid
                setErrors((prev) => ({
                  ...prev,
                  studentId: "Please enter a complete Student ID (00-00-0000)",
                }));
              }
            }, 1000);

            debouncedValidation();
            return () => debouncedValidation.cancel();
          }
          break;

        case "staff":
          if (field === "staffFacultyId" && value) {
            const formattedId = formatStaffFacultyId(value);

            // Debounced validation for staff ID
            const debouncedValidation = debounce(async () => {
              const { error: idError, participant: existingStaff } =
                await checkDuplicates(
                  "staffFacultyId",
                  formattedId,
                  currentEventId,
                  participantType
                );

              if (idError) {
                setDuplicateErrors((prev) => ({
                  ...prev,
                  staffFacultyId: idError,
                }));
              } else if (!existingStaff) {
                if (formattedId.length !== 3) {
                  setErrors((prev) => ({
                    ...prev,
                    staffFacultyId: "Please enter exactly 3 digits",
                  }));
                } else {
                  setSuccessMessage("This Staff/Faculty ID is available");
                }
              } else {
                setAutofillData(existingStaff);
                setShowAutofillDialog(true);
              }
            }, 1000);

            debouncedValidation();
            return () => debouncedValidation.cancel();
          }
          break;
      }

      // Handle name validation for all participant types
      if (field === "name" && value.trim()) {
        // Debounced name validation
        const debouncedNameValidation = debounce(async () => {
          const { error: nameError } = await checkDuplicates(
            "name",
            value.trim(),
            currentEventId,
            participantType
          );

          if (nameError) {
            setDuplicateErrors((prev) => ({ ...prev, name: nameError }));
          } else {
            // Show success message based on participant type
            const messages = {
              student: "This student name is available",
              staff: "This staff/faculty name is available",
              community: "This community member name is available",
            };
            setSuccessMessage(messages[participantType]);
          }
        }, 1000);

        debouncedNameValidation();
        return () => debouncedNameValidation.cancel();
      }

      // Other field validations
      switch (field) {
        case "age":
          const age = parseInt(value);
          if (isNaN(age) || age <= 0 || age > 125) {
            fieldError = "Age must be between 1 and 125";
          }
          break;
      }

      setErrors((prev) => ({
        ...prev,
        [field]: fieldError,
      }));
    } catch (error) {
      console.error("Error in handleInputChange:", error);
      toast.error("Error checking for duplicates");
      setError("Error checking for duplicates");
    }
  };

  // Add these render functions
  const renderParticipantTypeFields = () => {
    switch (participantType) {
      case "student":
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="studentId">Student ID</Label>
              <div className="relative">
                <Input
                  id="studentId"
                  name="studentId"
                  value={participantData.studentId || ""}
                  onChange={(e) => {
                    const formattedId = formatStudentId(e.target.value);
                    handleInputChange("studentId", formattedId);
                  }}
                  className={cn(
                    errors.studentId
                      ? "border-red-500"
                      : successMessage
                      ? "border-green-500"
                      : ""
                  )}
                  placeholder="XX-XX-XXXX"
                />
                {errors.studentId && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.studentId}
                  </p>
                )}
                {duplicateErrors.studentId && (
                  <p className="text-red-500 text-sm mt-1">
                    {duplicateErrors.studentId}
                  </p>
                )}
                {successMessage &&
                  !errors.studentId &&
                  !duplicateErrors.studentId && (
                    <p className="text-green-500 text-sm mt-1">
                      {successMessage}
                    </p>
                  )}
              </div>
            </div>
          </div>
        );
      case "staff":
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="staffFacultyId">Staff/Faculty ID</Label>
              <div className="relative">
                <Input
                  id="staffFacultyId"
                  name="staffFacultyId"
                  value={participantData.staffFacultyId || ""}
                  onChange={(e) => {
                    const formattedId = formatStaffFacultyId(e.target.value);
                    handleInputChange("staffFacultyId", formattedId);
                  }}
                  className={cn(
                    errors.staffFacultyId
                      ? "border-red-500"
                      : successMessage && participantData.staffFacultyId
                      ? "border-green-500"
                      : ""
                  )}
                  placeholder="XXX"
                />
                {errors.staffFacultyId && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.staffFacultyId}
                  </p>
                )}
                {duplicateErrors.staffFacultyId && (
                  <p className="text-red-500 text-sm mt-1">
                    {duplicateErrors.staffFacultyId}
                  </p>
                )}
                {successMessage &&
                  participantData.staffFacultyId &&
                  !errors.staffFacultyId &&
                  !duplicateErrors.staffFacultyId && (
                    <p className="text-green-500 text-sm mt-1">
                      {successMessage}
                    </p>
                  )}
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const renderCommonFields = () => {
    return (
      <div className="space-y-4">
        <div>
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            name="name"
            value={participantData.name || ""}
            onChange={(e) => handleInputChange("name", e.target.value)}
            className={cn(
              errors.name
                ? "border-red-500"
                : successMessage && participantData.name
                ? "border-green-500"
                : ""
            )}
            placeholder="Enter Full Name"
          />
          {errors.name && (
            <p className="text-red-500 text-sm mt-1">{errors.name}</p>
          )}
          {duplicateErrors.name && (
            <p className="text-red-500 text-sm mt-1">{duplicateErrors.name}</p>
          )}
          {successMessage &&
            participantData.name &&
            !errors.name &&
            !duplicateErrors.name && (
              <p className="text-green-500 text-sm mt-1">{successMessage}</p>
            )}
        </div>

        <div>
          <Label htmlFor="sex">Sex at Birth</Label>
          <Select
            value={participantData.sex || ""}
            onValueChange={(value) => handleInputChange("sex", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select sex" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Male">Male</SelectItem>
              <SelectItem value="Female">Female</SelectItem>
            </SelectContent>
          </Select>
          {errors.sex && (
            <p className="text-red-500 text-sm mt-1">{errors.sex}</p>
          )}
        </div>

        <div>
          <Label htmlFor="age">Age</Label>
          <Input
            id="age"
            name="age"
            type="number"
            value={participantData.age || ""}
            onChange={(e) => handleInputChange("age", e.target.value)}
            className={errors.age ? "border-red-500" : ""}
            placeholder="Age"
          />
          {errors.age && (
            <p className="text-red-500 text-sm mt-1">{errors.age}</p>
          )}
        </div>

        <div>
          <Label htmlFor="address">Address</Label>
          <Input
            id="address"
            name="address"
            value={participantData.address || ""}
            onChange={(e) => handleInputChange("address", e.target.value)}
            className={errors.address ? "border-red-500" : ""}
            placeholder="Complete Address"
          />
          {errors.address && (
            <p className="text-red-500 text-sm mt-1">{errors.address}</p>
          )}
        </div>
      </div>
    );
  };

  const renderStudentFields = () => {
    return (
      <div className="space-y-4">
        <div>
          <Label htmlFor="school">School</Label>
          <Select
            value={participantData.school || ""}
            onValueChange={(value) => handleInputChange("school", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select school" />
            </SelectTrigger>
            <SelectContent>
              {schoolOptions.map((school) => (
                <SelectItem key={school.name} value={school.name}>
                  {school.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.school && (
            <p className="text-red-500 text-sm mt-1">{errors.school}</p>
          )}
        </div>

        <div>
          <Label htmlFor="year">Year Level</Label>
          <Select
            value={participantData.year || ""}
            onValueChange={(value) => handleInputChange("year", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select year level" />
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
            <p className="text-red-500 text-sm mt-1">{errors.year}</p>
          )}
        </div>

        <div>
          <Label htmlFor="section">Section</Label>
          <Input
            id="section"
            name="section"
            value={participantData.section || ""}
            onChange={(e) => handleInputChange("section", e.target.value)}
            className={errors.section ? "border-red-500" : ""}
            placeholder="Section"
          />
          {errors.section && (
            <p className="text-red-500 text-sm mt-1">{errors.section}</p>
          )}
        </div>
      </div>
    );
  };

  const renderEthnicGroupFields = () => {
    return (
      <div>
        <Label htmlFor="ethnicGroup">Ethnic Group</Label>
        <Select
          value={participantData.ethnicGroup || ""}
          onValueChange={(value) => {
            handleInputChange("ethnicGroup", value);
            if (value !== "Other") {
              // Clear otherEthnicGroup when a predefined option is selected
              setParticipantData((prev) => ({
                ...prev,
                otherEthnicGroup: "",
              }));
            }
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select ethnic group" />
          </SelectTrigger>
          <SelectContent>
            {ethnicGroups.map((group) => (
              <SelectItem key={group} value={group}>
                {group}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.ethnicGroup && (
          <p className="text-red-500 text-sm mt-1">{errors.ethnicGroup}</p>
        )}
      </div>
    );
  };

  // Show input field for Other ethnic group
  {
    participantData.ethnicGroup === "Other" && (
      <div>
        <Label htmlFor="otherEthnicGroup">Specify Ethnic Group</Label>
        <Input
          id="otherEthnicGroup"
          name="otherEthnicGroup"
          value={participantData.otherEthnicGroup || ""}
          onChange={(e) =>
            handleInputChange("otherEthnicGroup", e.target.value)
          }
          className={errors.otherEthnicGroup ? "border-red-500" : ""}
          placeholder="Please specify your ethnic group"
        />
        {errors.otherEthnicGroup && (
          <p className="text-red-500 text-sm mt-1">{errors.otherEthnicGroup}</p>
        )}
      </div>
    );
  }

  // Render function
  const renderContent = () => {
    if (!networkStatus.isOnline) {
      return (
        <NetworkStatus
          title="No Internet Connection"
          message="Please check your internet connection to manage participants."
          onRetry={() => window.location.reload()}
          isOffline={true}
        />
      );
    }

    if (error) {
      return (
        <NetworkStatus
          title="Connection Error"
          message={error}
          onRetry={() => fetchParticipants(currentEventId)}
          isOffline={false}
        />
      );
    }

    if (!currentAcademicPeriod) {
      return (
        <Card className="w-full h-[200px] flex items-center justify-center">
          <div className="text-center space-y-4">
            <ColorfulLoader />
            <p className="text-lg text-muted-foreground">
              Loading academic period...
            </p>
          </div>
        </Card>
      );
    }

    if (isLoading) {
      return (
        <div className="flex items-center justify-center p-8">
          <ColorfulSpinner />
        </div>
      );
    }

    if (!events || events.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center p-8">
          <h2 className="text-xl font-semibold mb-2">No Events Available</h2>
          <p className="text-muted-foreground mb-4">
            Create an event first to manage participants.
          </p>
          <Button onClick={() => setActiveTab("createEvent")}>
            <Plus className="mr-2 h-4 w-4" /> Create Event
          </Button>
        </div>
      );
    }

    return (
      <>
        {showPreviewDialog && (
          <PreviewDialog
            data={previewData}
            onConfirm={() => {
              if (previewData) {
                setParticipantData((prev) => ({
                  ...prev,
                  ...previewData,
                }));
              }
              setShowPreviewDialog(false);
              setPreviewData(null);
            }}
            onCancel={() => {
              setShowPreviewDialog(false);
              setPreviewData(null);
            }}
          />
        )}

        {renderAutofillDialog()}

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Add Participant</CardTitle>
                <CardDescription>
                  {currentEvent
                    ? `Add participants to ${currentEvent.eventName}`
                    : "Loading event..."}
                </CardDescription>
              </div>
              {events.length > 1 && (
                <div className="flex items-center gap-4">
                  <div className="text-sm text-muted-foreground">
                    Total Events: {events?.length || 0}
                  </div>
                  <div className="flex items-center gap-2">
                    <Select
                      value={currentEventId || ""}
                      onValueChange={(value) => {
                        const event = events.find((e) => e.$id === value);
                        setCurrentEventId(value);
                        setCurrentEvent(event);
                      }}
                    >
                      <SelectTrigger className="w-[300px]">
                        <SelectValue placeholder="Select an event" />
                         <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-4 w-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Select an event to manage participants</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                      </SelectTrigger>
                      <SelectContent>
                        {events.map((event) => (
                          <SelectItem key={event.$id} value={event.$id}>
                            {event.eventName}
                          </SelectItem>
                        ))}
                        
                      </SelectContent>
                      
                    </Select>
                   
                  </div>
                </div>
              )}
            </div>

            {/* Only show statistics if there's a valid event selected */}
            {isValidEvent(currentEvent) && (
              <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="bg-primary text-primary-foreground p-4 rounded-lg">
                  <h3 className="text-lg font-semibold">Total Participants</h3>
                  <p className="text-3xl font-bold">{totalParticipants}</p>
                  <div className="text-sm mt-2">
                    <span className="text-blue-200">
                      M: {totalMaleParticipants}
                    </span>{" "}
                    /
                    <span className="text-pink-200">
                      F: {totalFemaleParticipants}
                    </span>
                  </div>
                </div>
                <div className="bg-blue-500 text-white p-4 rounded-lg">
                  <h3 className="text-lg font-semibold">Students</h3>
                  <p className="text-3xl font-bold">{tabCounts.student}</p>
                  <div className="mt-2 text-sm">
                    <span className="mr-3">
                      Male: {getGenderCounts("student").male}
                    </span>
                    <span>Female: {getGenderCounts("student").female}</span>
                  </div>
                </div>
                <div className="bg-green-500 text-white p-4 rounded-lg">
                  <h3 className="text-lg font-semibold">Staff/Faculty</h3>
                  <p className="text-3xl font-bold">{tabCounts.staff}</p>
                  <div className="mt-2 text-sm">
                    <span className="mr-3">
                      Male: {getGenderCounts("staff").male}
                    </span>
                    <span>Female: {getGenderCounts("staff").female}</span>
                  </div>
                </div>
                <div className="bg-purple-500 text-white p-4 rounded-lg">
                  <h3 className="text-lg font-semibold">Community</h3>
                  <p className="text-3xl font-bold">{tabCounts.community}</p>
                  <div className="mt-2 text-sm">
                    <span className="mr-3">
                      Male: {getGenderCounts("community").male}
                    </span>
                    <span>Female: {getGenderCounts("community").female}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-4 mt-4">
              <div className="flex gap-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={
                          participantType === "student" ? "default" : "outline"
                        }
                        onClick={() => handleParticipantTypeChange("student")}
                        className="flex-1"
                      >
                        <GraduationCap className="mr-2 h-4 w-4" />
                        Students
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Add student participants</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={
                          participantType === "staff" ? "default" : "outline"
                        }
                        onClick={() => handleParticipantTypeChange("staff")}
                        className="flex-1"
                      >
                        <Users className="mr-2 h-4 w-4" />
                        Staff/Faculty
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Add staff/faculty participants</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={
                          participantType === "community"
                            ? "default"
                            : "outline"
                        }
                        onClick={() => handleParticipantTypeChange("community")}
                        className="flex-1"
                      >
                        <UsersRound className="mr-2 h-4 w-4" />
                        Community
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Add community member participants</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          </CardHeader>

          {/* Only show the form if an event is selected */}
          {isValidEvent(currentEvent) ? (
            <form onSubmit={handleAddParticipant}>
              <CardContent>
                <div className="grid grid-cols-2 gap-6">
                  {participantType === "community" ? (
                    // Community form layout - two columns
                    <>
                      {/* Left Column */}
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="name">Name</Label>
                          <Input
                            id="name"
                            name="name"
                            value={participantData.name || ""}
                            onChange={(e) =>
                              handleInputChange("name", e.target.value)
                            }
                            className={cn(
                              errors.name
                                ? "border-red-500"
                                : successMessage && participantData.name
                                ? "border-green-500"
                                : ""
                            )}
                            placeholder="Enter Full Name"
                          />
                          {errors.name && (
                            <p className="text-red-500 text-sm mt-1">
                              {errors.name}
                            </p>
                          )}
                          {duplicateErrors.name && (
                            <p className="text-red-500 text-sm mt-1">
                              {duplicateErrors.name}
                            </p>
                          )}
                          {successMessage &&
                            participantData.name &&
                            !errors.name &&
                            !duplicateErrors.name && (
                              <p className="text-green-500 text-sm mt-1">
                                {successMessage}
                              </p>
                            )}
                        </div>

                        <div>
                          <Label htmlFor="sex">Sex at Birth</Label>
                          <Select
                            value={participantData.sex || ""}
                            onValueChange={(value) =>
                              handleInputChange("sex", value)
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select sex" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Male">Male</SelectItem>
                              <SelectItem value="Female">Female</SelectItem>
                            </SelectContent>
                          </Select>
                          {errors.sex && (
                            <p className="text-red-500 text-sm mt-1">
                              {errors.sex}
                            </p>
                          )}
                        </div>

                        <div>
                          <Label htmlFor="address">Home Address</Label>
                          <Input
                            id="address"
                            name="address"
                            value={participantData.address || ""}
                            onChange={(e) =>
                              handleInputChange("address", e.target.value)
                            }
                            className={errors.address ? "border-red-500" : ""}
                            placeholder="Enter Complete Address"
                          />
                          {errors.address && (
                            <p className="text-red-500 text-sm mt-1">
                              {errors.address}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Right Column */}
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="age">Age</Label>
                          <Input
                            id="age"
                            name="age"
                            type="number"
                            value={participantData.age || ""}
                            onChange={(e) =>
                              handleInputChange("age", e.target.value)
                            }
                            className={errors.age ? "border-red-500" : ""}
                            placeholder="Enter Age"
                          />
                          {errors.age && (
                            <p className="text-red-500 text-sm mt-1">
                              {errors.age}
                            </p>
                          )}
                        </div>

                        <div>
                          <Label htmlFor="ethnicGroup">Ethnic Group</Label>
                          <Select
                            value={participantData.ethnicGroup || ""}
                            onValueChange={(value) => {
                              handleInputChange("ethnicGroup", value);
                              if (value !== "Other") {
                                setParticipantData((prev) => ({
                                  ...prev,
                                  otherEthnicGroup: "",
                                }));
                              }
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select ethnic group" />
                            </SelectTrigger>
                            <SelectContent>
                              {ethnicGroups.map((group) => (
                                <SelectItem key={group} value={group}>
                                  {group}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {errors.ethnicGroup && (
                            <p className="text-red-500 text-sm mt-1">
                              {errors.ethnicGroup}
                            </p>
                          )}
                        </div>

                        {participantData.ethnicGroup === "Other" && (
                          <div>
                            <Label htmlFor="otherEthnicGroup">
                              Specify Ethnic Group
                            </Label>
                            <Input
                              id="otherEthnicGroup"
                              name="otherEthnicGroup"
                              value={participantData.otherEthnicGroup || ""}
                              onChange={(e) =>
                                handleInputChange(
                                  "otherEthnicGroup",
                                  e.target.value
                                )
                              }
                              className={
                                errors.otherEthnicGroup ? "border-red-500" : ""
                              }
                              placeholder="Please specify your ethnic group"
                            />
                            {errors.otherEthnicGroup && (
                              <p className="text-red-500 text-sm mt-1">
                                {errors.otherEthnicGroup}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    // Student and Staff form layout - two columns
                    <>
                      {/* Left Column */}
                      <div className="space-y-4">
                        {renderParticipantTypeFields()}

                        <div>
                          <Label htmlFor="sex">Sex at Birth</Label>
                          <Select
                            value={participantData.sex || ""}
                            onValueChange={(value) =>
                              handleInputChange("sex", value)
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select sex" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Male">Male</SelectItem>
                              <SelectItem value="Female">Female</SelectItem>
                            </SelectContent>
                          </Select>
                          {errors.sex && (
                            <p className="text-red-500 text-sm mt-1">
                              {errors.sex}
                            </p>
                          )}
                        </div>

                        <div>
                          <Label htmlFor="address">Home Address</Label>
                          <Input
                            id="address"
                            name="address"
                            value={participantData.address || ""}
                            onChange={(e) =>
                              handleInputChange("address", e.target.value)
                            }
                            className={errors.address ? "border-red-500" : ""}
                            placeholder="Enter Complete Address"
                          />
                          {errors.address && (
                            <p className="text-red-500 text-sm mt-1">
                              {errors.address}
                            </p>
                          )}
                        </div>

                        {participantType === "student" && (
                          <>
                            <div>
                              <Label htmlFor="school">School</Label>
                              <Select
                                value={participantData.school || ""}
                                onValueChange={(value) =>
                                  handleInputChange("school", value)
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select school" />
                                </SelectTrigger>
                                <SelectContent>
                                  {schoolOptions.map((school) => (
                                    <SelectItem
                                      key={school.name}
                                      value={school.name}
                                    >
                                      {school.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              {errors.school && (
                                <p className="text-red-500 text-sm mt-1">
                                  {errors.school}
                                </p>
                              )}
                            </div>

                            <div>
                              <Label htmlFor="section">Section</Label>
                              <Input
                                id="section"
                                name="section"
                                value={participantData.section || ""}
                                onChange={(e) =>
                                  handleInputChange("section", e.target.value)
                                }
                                className={
                                  errors.section ? "border-red-500" : ""
                                }
                                placeholder="Enter section"
                              />
                              {errors.section && (
                                <p className="text-red-500 text-sm mt-1">
                                  {errors.section}
                                </p>
                              )}
                            </div>
                          </>
                        )}
                      </div>

                      {/* Right Column */}
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="name">Name</Label>
                          <Input
                            id="name"
                            name="name"
                            value={participantData.name || ""}
                            onChange={(e) =>
                              handleInputChange("name", e.target.value)
                            }
                            className={cn(
                              errors.name
                                ? "border-red-500"
                                : successMessage && participantData.name
                                ? "border-green-500"
                                : ""
                            )}
                            placeholder="Enter Full Name"
                          />
                          {errors.name && (
                            <p className="text-red-500 text-sm mt-1">
                              {errors.name}
                            </p>
                          )}
                          {duplicateErrors.name && (
                            <p className="text-red-500 text-sm mt-1">
                              {duplicateErrors.name}
                            </p>
                          )}
                          {successMessage &&
                            participantData.name &&
                            !errors.name &&
                            !duplicateErrors.name && (
                              <p className="text-green-500 text-sm mt-1">
                                {successMessage}
                              </p>
                            )}
                        </div>

                        <div>
                          <Label htmlFor="age">Age</Label>
                          <Input
                            id="age"
                            name="age"
                            type="number"
                            value={participantData.age || ""}
                            onChange={(e) =>
                              handleInputChange("age", e.target.value)
                            }
                            className={errors.age ? "border-red-500" : ""}
                            placeholder="Enter Age"
                          />
                          {errors.age && (
                            <p className="text-red-500 text-sm mt-1">
                              {errors.age}
                            </p>
                          )}
                        </div>

                        {participantType === "student" && (
                          <div>
                            <Label htmlFor="year">Year Level</Label>
                            <Select
                              value={participantData.year || ""}
                              onValueChange={(value) =>
                                handleInputChange("year", value)
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select year level" />
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
                              <p className="text-red-500 text-sm mt-1">
                                {errors.year}
                              </p>
                            )}
                          </div>
                        )}

                        <div>
                          <Label htmlFor="ethnicGroup">Ethnic Group</Label>
                          <Select
                            value={participantData.ethnicGroup || ""}
                            onValueChange={(value) => {
                              handleInputChange("ethnicGroup", value);
                              if (value !== "Other") {
                                setParticipantData((prev) => ({
                                  ...prev,
                                  otherEthnicGroup: "",
                                }));
                              }
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select ethnic group" />
                            </SelectTrigger>
                            <SelectContent>
                              {ethnicGroups.map((group) => (
                                <SelectItem key={group} value={group}>
                                  {group}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {errors.ethnicGroup && (
                            <p className="text-red-500 text-sm mt-1">
                              {errors.ethnicGroup}
                            </p>
                          )}
                        </div>

                        {participantData.ethnicGroup === "Other" && (
                          <div>
                            <Label htmlFor="otherEthnicGroup">
                              Specify Ethnic Group
                            </Label>
                            <Input
                              id="otherEthnicGroup"
                              name="otherEthnicGroup"
                              value={participantData.otherEthnicGroup || ""}
                              onChange={(e) =>
                                handleInputChange(
                                  "otherEthnicGroup",
                                  e.target.value
                                )
                              }
                              className={
                                errors.otherEthnicGroup ? "border-red-500" : ""
                              }
                              placeholder="Please specify your ethnic group"
                            />
                            {errors.otherEthnicGroup && (
                              <p className="text-red-500 text-sm mt-1">
                                {errors.otherEthnicGroup}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  type="submit"
                  disabled={
                    loading ||
                    !currentEventId ||
                    !!duplicateErrors.studentId ||
                    !!duplicateErrors.name
                  }
                >
                  {loading ? (
                    <>
                      <ColorfulSpinner size="sm" className="mr-2" />
                      Please wait
                    </>
                  ) : (
                    "Add Participant"
                  )}
                </Button>
              </CardFooter>
            </form>
          ) : (
            <CardContent>
              <div className="text-center py-8">
                <div className="mb-4">
                  <Users className="mx-auto h-12 w-12 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2">
                  No Event Selected
                </h3>
                <p className="text-muted-foreground">
                  Please select or create an event to start adding participants.
                </p>
              </div>
            </CardContent>
          )}

          {/* Add the table section */}
          {isValidEvent(currentEvent) && (
            <div className="mt-6">
              <ParticipantTables
                participants={participants}
                onUpdateParticipant={handleUpdateParticipant}
                onDeleteParticipant={(participantId) =>
                  handleDeleteParticipant(participantId, participantType)
                }
                isFinalized={false}
              />
            </div>
          )}
        </Card>
      </>
    );
  };

  return <div className="space-y-4">{renderContent()}</div>;
}
