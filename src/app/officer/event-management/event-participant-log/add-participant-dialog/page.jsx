"use client"

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
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
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Plus, HelpCircle, Loader2 } from 'lucide-react';
import {
  capitalizeWords,
  formatStudentId,
  schoolOptions,
  isStudentIdComplete
} from "@/utils/participantUtils";
import {
  createParticipant,
} from "@/lib/appwrite";
import { toast } from "react-toastify";
import { debounce } from 'lodash';
import { databases, databaseId, participantCollectionId } from "@/lib/appwrite";
import { Query } from "appwrite";

const AddParticipant = ({
  onAddParticipant,
  eventId,
  isEventSelected,
  currentEvent,
}) => {
  const [participantData, setParticipantData] = useState({
    participantType: "",
    studentId: "",
    staffFacultyId: "",
    name: "",
    sex: "",
    age: "",
    school: "",
    year: "",
    section: "",
    address: "",
    ethnicGroup: "",
    otherEthnicGroup: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [totalParticipants, setTotalParticipants] = useState(0);
  const [totalMaleParticipants, setTotalMaleParticipants] = useState(0);
  const [totalFemaleParticipants, setTotalFemaleParticipants] = useState(0);
  const [showAutofillDialog, setShowAutofillDialog] = useState(false);
  const [autofillData, setAutofillData] = useState(null);
  const [duplicateErrors, setDuplicateErrors] = useState({});
  const [newEntryInfo, setNewEntryInfo] = useState({});

  useEffect(() => {
    if (currentEvent && currentEvent.participants) {
      const participants = currentEvent.participants;
      setTotalParticipants(participants.length);
      setTotalMaleParticipants(
        participants.filter((p) => p.sex?.toLowerCase() === "male").length
      );
      setTotalFemaleParticipants(
        participants.filter((p) => p.sex?.toLowerCase() === "female").length
      );
    } else {
      setTotalParticipants(0);
      setTotalMaleParticipants(0);
      setTotalFemaleParticipants(0);
    }
  }, [currentEvent]);

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

  const handleInputChange = (field, value) => {
    let processedValue = value;
    
    // Special handling for different fields
    switch (field) {
      case "studentId":
        processedValue = formatStudentId(value);
        if (isStudentIdComplete(processedValue)) {
          debouncedCheckDuplicates(processedValue, eventId, setDuplicateErrors);
          handleAutofill(processedValue, setAutofillData, setShowAutofillDialog);
        }
        break;
      case "staffFacultyId":
        processedValue = value.toUpperCase();
        break;
      case "name":
        processedValue = capitalizeWords(value);
        break;
      case "age":
        processedValue = value.replace(/\D/g, '');
        break;
      case "section":
        processedValue = value.toUpperCase();
        break;
      default:
        break;
    }

    setParticipantData(prev => ({
      ...prev,
      [field]: processedValue
    }));

    // Clear errors for the field being changed
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateFields = () => {
    const newErrors = {};

    // Common validations for all participant types
    if (!participantData.participantType) {
      newErrors.participantType = "Participant type is required";
    }
    if (!participantData.name) {
      newErrors.name = "Name is required";
    }
    if (!participantData.sex) {
      newErrors.sex = "Sex is required";
    }
    if (!participantData.age || participantData.age < 1 || participantData.age > 125) {
      newErrors.age = "Age must be between 1 and 125";
    }
    if (!participantData.address) {
      newErrors.address = "Address is required";
    }
    if (!participantData.ethnicGroup) {
      newErrors.ethnicGroup = "Ethnic group is required";
    }
    if (participantData.ethnicGroup === "Other" && !participantData.otherEthnicGroup) {
      newErrors.otherEthnicGroup = "Please specify the ethnic group";
    }

    // Type-specific validations
    switch (participantData.participantType) {
      case "student":
        if (!participantData.studentId) {
          newErrors.studentId = "Student ID is required";
        }
        if (!participantData.school) {
          newErrors.school = "School is required";
        }
        if (!participantData.year) {
          newErrors.year = "Year is required";
        }
        if (!participantData.section) {
          newErrors.section = "Section is required";
        }
        break;
      case "staff":
        if (!participantData.staffFacultyId) {
          newErrors.staffFacultyId = "Staff/Faculty ID is required";
        }
        break;
      default:
        break;
    }

    return newErrors;
  };

  const handleAddParticipant = async () => {
    const validationErrors = validateFields();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    try {
      // Check for duplicates based on participant type
      let isDuplicate = false;
      if (participantData.participantType === "student" && participantData.studentId) {
        isDuplicate = await checkDuplicateParticipant(eventId, participantData.studentId);
      } else if (participantData.participantType === "staff" && participantData.staffFacultyId) {
        isDuplicate = await checkDuplicateParticipant(eventId, participantData.staffFacultyId);
      }

      if (isDuplicate) {
        toast.error("This participant is already registered for this event");
        return;
      }

      // Prepare participant data for submission
      const participantToAdd = {
        ...participantData,
        eventId,
        ethnicGroup: participantData.ethnicGroup === "Other" 
          ? participantData.otherEthnicGroup 
          : participantData.ethnicGroup
      };

      const response = await createParticipant(participantToAdd);
      
      if (response) {
        onAddParticipant(response);
        toast.success("Participant added successfully");
        // Reset form
        setParticipantData({
          participantType: "",
          studentId: "",
          staffFacultyId: "",
          name: "",
          sex: "",
          age: "",
          school: "",
          year: "",
          section: "",
          address: "",
          ethnicGroup: "",
          otherEthnicGroup: "",
        });
        setErrors({});
      }
    } catch (error) {
      console.error("Error adding participant:", error);
      toast.error("Failed to add participant");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>
          <Plus /> Add Participant
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Participant</DialogTitle>
          <DialogDescription>
            Fill in the participant details below
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="participantType" className="text-right">
              Type
            </Label>
            <Select
              value={participantData.participantType}
              onValueChange={(value) =>
                setParticipantData({
                  ...participantData,
                  participantType: value,
                  // Reset IDs when type changes
                  studentId: "",
                  staffFacultyId: "",
                })
              }
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="student">Student</SelectItem>
                <SelectItem value="staff">Staff/Faculty</SelectItem>
                <SelectItem value="community">Community</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {participantData.participantType === "student" && (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="studentId" className="text-right">
                Student ID
              </Label>
              <Input
                id="studentId"
                value={participantData.studentId}
                onChange={(e) => handleInputChange("studentId", e.target.value)}
                className="col-span-3"
                placeholder="Enter student ID"
              />
            </div>
          )}

          {participantData.participantType === "staff" && (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="staffFacultyId" className="text-right">
                Staff/Faculty ID
              </Label>
              <Input
                id="staffFacultyId"
                value={participantData.staffFacultyId}
                onChange={(e) => handleInputChange("staffFacultyId", e.target.value)}
                className="col-span-3"
                placeholder="Enter staff/faculty ID"
              />
            </div>
          )}

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Name
            </Label>
            <Input
              id="name"
              value={participantData.name}
              onChange={(e) => handleInputChange("name", capitalizeWords(e.target.value))}
              className="col-span-3"
              placeholder="Enter full name"
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="sex" className="text-right">
              Sex
            </Label>
            <Select
              value={participantData.sex}
              onValueChange={(value) =>
                setParticipantData({ ...participantData, sex: value })
              }
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select sex" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Male">Male</SelectItem>
                <SelectItem value="Female">Female</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="age" className="text-right">
              Age
            </Label>
            <Input
              id="age"
              type="number"
              value={participantData.age}
              onChange={(e) => handleInputChange("age", e.target.value)}
              className="col-span-3"
              placeholder="Enter age"
            />
          </div>

          {participantData.participantType === "student" && (
            <>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="school" className="text-right">
                  School
                </Label>
                <Select
                  value={participantData.school}
                  onValueChange={(value) =>
                    setParticipantData({ ...participantData, school: value })
                  }
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select school" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="School of Engineering">School of Engineering</SelectItem>
                    <SelectItem value="School of Architecture">School of Architecture</SelectItem>
                    <SelectItem value="School of Computing">School of Computing</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="year" className="text-right">
                  Year
                </Label>
                <Select
                  value={participantData.year}
                  onValueChange={(value) =>
                    setParticipantData({ ...participantData, year: value })
                  }
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="First Year">First Year</SelectItem>
                    <SelectItem value="Second Year">Second Year</SelectItem>
                    <SelectItem value="Third Year">Third Year</SelectItem>
                    <SelectItem value="Fourth Year">Fourth Year</SelectItem>
                    <SelectItem value="Fifth Year">Fifth Year</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="section" className="text-right">
                  Section
                </Label>
                <Input
                  id="section"
                  value={participantData.section}
                  onChange={(e) => handleInputChange("section", e.target.value)}
                  className="col-span-3"
                  placeholder="Enter section"
                />
              </div>
            </>
          )}

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="address" className="text-right">
              Address
            </Label>
            <Input
              id="address"
              value={participantData.address}
              onChange={(e) => handleInputChange("address", e.target.value)}
              className="col-span-3"
              placeholder="Enter address"
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="ethnicGroup" className="text-right">
              Ethnic Group
            </Label>
            <Select
              value={participantData.ethnicGroup}
              onValueChange={(value) =>
                setParticipantData({
                  ...participantData,
                  ethnicGroup: value,
                  otherEthnicGroup: value === "Other" ? "" : participantData.otherEthnicGroup,
                })
              }
            >
              <SelectTrigger className="col-span-3">
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
          </div>

          {participantData.ethnicGroup === "Other" && (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="otherEthnicGroup" className="text-right">
                Specify
              </Label>
              <Input
                id="otherEthnicGroup"
                value={participantData.otherEthnicGroup}
                onChange={(e) => handleInputChange("otherEthnicGroup", e.target.value)}
                className="col-span-3"
                placeholder="Specify ethnic group"
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button onClick={handleAddParticipant} disabled={loading || !isEventSelected}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Adding...
              </>
            ) : (
              "Add Participant"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>

      <AlertDialog open={showAutofillDialog} onOpenChange={setShowAutofillDialog}>
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
    </Dialog>
  );
};

export default AddParticipant;

