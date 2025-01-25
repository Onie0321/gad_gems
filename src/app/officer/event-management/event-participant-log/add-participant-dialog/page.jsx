"use client"

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
  debouncedCheckDuplicates,
  handleAutofill,
  checkDuplicates,
  isStudentIdComplete
} from "@/utils/participantUtils";
import {
  createParticipant,
  checkDuplicateParticipant,
} from "@/lib/appwrite";
import { toast } from "react-toastify";
import { debounce } from 'lodash';

const AddParticipant = ({
  onAddParticipant,
  eventId,
  isEventSelected,
  currentEvent,
}) => {
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
    homeAddress: "",
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

  const validateFields = () => {
    const newErrors = {};
    if (!participantData.studentId)
      newErrors.studentId = "Student ID is required.";
    if (!participantData.name) newErrors.name = "Name is required.";
    if (!participantData.sex) newErrors.sex = "Sex is required.";
    if (
      !participantData.age ||
      participantData.age < 1 ||
      participantData.age > 125
    )
      newErrors.age = "Age must be between 1 and 125.";
    if (!participantData.school) newErrors.school = "School is required.";
    if (!participantData.year) newErrors.year = "Year is required.";
    if (!participantData.section) newErrors.section = "Section is required.";
    if (!participantData.homeAddress) newErrors.homeAddress = "Home address is required.";
    if (!participantData.ethnicGroup)
      newErrors.ethnicGroup = "Ethnic Group is required.";
    if (
      participantData.ethnicGroup === "Other" &&
      !participantData.otherEthnicGroup
    )
      newErrors.otherEthnicGroup = "Please specify ethnic group.";
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
      const participants = currentEvent?.participants || [];

      const isDuplicateId = await checkDuplicateParticipant(
        eventId,
        participantData.studentId
      );
      const isDuplicateName =
        participantData.name &&
        participants.some(
          (p) => p.name?.toLowerCase() === participantData.name?.toLowerCase()
        );

      if (isDuplicateId || isDuplicateName) {
        if (isDuplicateId) {
          toast.error(
            "A participant with this Student ID already exists in this event."
          );
        }
        if (isDuplicateName) {
          toast.error(
            "A participant with this name already exists in this event."
          );
        }
        setLoading(false);
        return;
      }

      const newParticipant = {
        ...participantData,
        age: parseInt(participantData.age),
        eventId: eventId,
      };

      const createdParticipant = await createParticipant(newParticipant);
      onAddParticipant(createdParticipant);
      toast.success("Participant added successfully");

      setTotalParticipants((prev) => prev + 1);
      if (newParticipant.sex === "Male") {
        setTotalMaleParticipants((prev) => prev + 1);
      } else if (newParticipant.sex === "Female") {
        setTotalFemaleParticipants((prev) => prev + 1);
      }

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
        homeAddress: "",
      });
      setErrors({});
    } catch (error) {
      toast.error(`Error adding participant: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = async (field, value) => {
    setParticipantData((prev) => ({ ...prev, [field]: value }));

    if (field === "studentId" || field === "name") {
      if (field === "studentId" && !isStudentIdComplete(value)) {
        // Clear errors and new entry info if student ID is incomplete
        setDuplicateErrors((prev) => ({ ...prev, [field]: "" }));
        setNewEntryInfo((prev) => ({ ...prev, [field]: "" }));
        return;
      }

      try {
        // Check for duplicates
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
          // Handle autofill logic for student ID
          const autofillData = await handleAutofill(value, currentEventId);
          if (autofillData) {
            setAutofillData(autofillData);
            setShowAutofillDialog(true);
          }
        }
      } catch (error) {
        console.error("Error checking duplicates:", error);
        toast.error("An error occurred while checking for duplicates.");
      }
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
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-primary text-primary-foreground p-4 rounded-lg">
              <h3 className="text-lg font-semibold">Total</h3>
              <p className="text-3xl font-bold">{totalParticipants}</p>
            </div>
            <div className="bg-blue-500 text-white p-4 rounded-lg">
              <h3 className="text-lg font-semibold">Male</h3>
              <p className="text-3xl font-bold">{totalMaleParticipants}</p>
            </div>
            <div className="bg-pink-500 text-white p-4 rounded-lg">
              <h3 className="text-lg font-semibold">Female</h3>
              <p className="text-3xl font-bold">{totalFemaleParticipants}</p>
            </div>
          </div>
          {currentEvent && (
            <p className="text-sm text-muted-foreground">
              Adding participant to:{" "}
              {currentEvent?.eventName || "Unnamed Event"}
            </p>
          )}
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
                          const formattedStudentId = formatStudentId(
                            e.target.value
                          );
                          handleInputChange("studentId", formattedStudentId);
                          setParticipantData({
                            ...participantData,
                            studentId: formattedStudentId,
                          });
                        }}
                        placeholder="00-00-0000"
                        maxLength={10}
                        disabled={!isEventSelected}
                      />
                      <HelpCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Enter a valid student ID.</p>
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
                  handleInputChange("name", formattedName);
                  setParticipantData({
                    ...participantData,
                    name: formattedName,
                  });
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
                value={participantData.sex}
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
                    setParticipantData({ ...participantData, age: value });
                  }
                }}
                placeholder="Enter age"
                min="1"
                max="125"
                disabled={!isEventSelected}
              />
              {errors.age && (
                <p className="text-sm text-red-500">{errors.age}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="school">School</Label>
              <Select
                value={participantData.school}
                onValueChange={(value) =>
                  setParticipantData({
                    ...participantData,
                    school: value,
                    year: "",
                    section: "",
                  })
                }
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
                value={participantData.year}
                onValueChange={(value) =>
                  setParticipantData({
                    ...participantData,
                    year: value,
                    section: "",
                  })
                }
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
        </div>
        <DialogFooter>
          <Button
            onClick={handleAddParticipant}
            disabled={loading || !isEventSelected}
          >
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
    </Dialog>
  );
};

export default AddParticipant;

