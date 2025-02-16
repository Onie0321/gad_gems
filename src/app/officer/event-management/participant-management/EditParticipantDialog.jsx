"use client";
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "react-toastify";
import {
  capitalizeWords,
  validateEditParticipantForm,
  schoolOptions,
} from "@/utils/participantUtils";
import {
  databases,
  databaseId,
  studentsCollectionId,
  staffFacultyCollectionId,
  communityCollectionId,
} from "@/lib/appwrite";

export default function EditParticipantDialog({
  participant,
  onUpdateParticipant,
  participantType,
  isOpen,
  onClose,
}) {
  const [editedParticipant, setEditedParticipant] = useState({
    ...participant,
    participantType: participantType,
  });
  const [errors, setErrors] = useState({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);

  // Function to check if there are unsaved changes
  const checkUnsavedChanges = (newData) => {
    // Only compare fields that are editable for each participant type
    const compareFields = {
      student: [
        "name",
        "sex",
        "age",
        "address",
        "school",
        "year",
        "section",
        "ethnicGroup",
        "otherEthnicGroup",
      ],
      staff: [
        "name",
        "sex",
        "age",
        "address",
        "ethnicGroup",
        "otherEthnicGroup",
      ],
      community: [
        "name",
        "sex",
        "age",
        "address",
        "ethnicGroup",
        "otherEthnicGroup",
      ],
    };

    const fieldsToCompare = compareFields[participantType];
    const hasChanges = fieldsToCompare.some(
      (field) => participant[field] !== newData[field]
    );
    setHasUnsavedChanges(hasChanges);
  };

  // Update checkUnsavedChanges whenever editedParticipant changes
  useEffect(() => {
    checkUnsavedChanges(editedParticipant);
  }, [editedParticipant, participant, participantType]);

  const handleSaveChanges = async () => {
    console.log("Starting update with participant data:", editedParticipant);

    const validationErrors = validateEditParticipantForm(editedParticipant);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      toast.error("Please fix the errors before saving.");
      return;
    }

    try {
      const participantType = editedParticipant.participantType;
      console.log("Determined participant type:", participantType);

      // Determine the collection based on participant type
      let collectionId;
      switch (participantType) {
        case "student":
          collectionId = studentsCollectionId;
          console.log("Selected student collection:", collectionId);
          break;
        case "staff":
          collectionId = staffFacultyCollectionId;
          console.log("Selected staff collection:", collectionId);
          break;
        case "community":
          collectionId = communityCollectionId;
          console.log("Selected community collection:", collectionId);
          break;
        default:
          console.error("Invalid participant type:", {
            participantType,
            participant: editedParticipant,
          });
          throw new Error("Invalid participant type");
      }

      // Prepare update data based on participant type
      let updateData = {
        name: editedParticipant.name,
        age: editedParticipant.age,
        sex: editedParticipant.sex,
        ethnicGroup: editedParticipant.ethnicGroup,
        otherEthnicGroup: editedParticipant.otherEthnicGroup,
        eventId: editedParticipant.eventId,
        createdBy: editedParticipant.createdBy,
        academicPeriodId: editedParticipant.academicPeriodId,
        isArchived: editedParticipant.isArchived || false,
        participantType,
        address: editedParticipant.address,
      };

      console.log("Base update data:", updateData);

      // Add type-specific fields
      if (participantType === "student") {
        updateData = {
          ...updateData,
          school: editedParticipant.school,
          year: editedParticipant.year,
          section: editedParticipant.section,
          studentId: editedParticipant.studentId,
        };
        console.log("Student-specific update data:", updateData);
      } else if (participantType === "staff") {
        updateData = {
          ...updateData,
          staffFacultyId: editedParticipant.staffFacultyId,
        };
        console.log("Staff-specific update data:", updateData);
      }

      console.log("Final update data:", {
        databaseId,
        collectionId,
        participantId: editedParticipant.$id,
        updateData,
      });

      // Update the participant in the database
      const response = await databases.updateDocument(
        databaseId,
        collectionId,
        editedParticipant.$id,
        updateData
      );

      console.log("Update response:", response);

      onUpdateParticipant(response);
      toast.success("Participant updated successfully");
      setHasUnsavedChanges(false);
      onClose?.();
    } catch (error) {
      console.error("Error updating participant:", {
        error: error.message,
        stack: error.stack,
        participantId: editedParticipant.$id,
        participantType,
        editedParticipant,
        fullError: error,
      });
      toast.error("Failed to update participant. Please try again.");
    }
  };

  const handleClose = () => {
    if (hasUnsavedChanges) {
      setShowUnsavedDialog(true);
    } else {
      onClose?.();
    }
  };

  const handleDiscardChanges = () => {
    setShowUnsavedDialog(false);
    setHasUnsavedChanges(false);
    onClose?.();
  };

  return (
    <>
      <Dialog
        open={isOpen}
        onOpenChange={(open) => {
          if (!open) {
            handleClose();
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Participant</DialogTitle>
            <DialogDescription>
              Update the details for this participant.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* Staff/Faculty ID - Read Only */}
            {participantType === "staff" && (
              <div className="grid grid-cols-4 items-center gap-4">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Label htmlFor="staffFacultyId" className="text-right">
                        Staff/Faculty ID
                      </Label>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Unique identifier for staff/faculty member</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <Input
                  id="staffFacultyId"
                  value={editedParticipant.staffFacultyId || ""}
                  readOnly
                  className="col-span-3"
                />
              </div>
            )}

            {/* Student ID - Read Only */}
            {participantType === "student" && (
              <div className="grid grid-cols-4 items-center gap-4">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Label htmlFor="studentId" className="text-right">
                        Student ID
                      </Label>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Unique identifier for student</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <Input
                  id="studentId"
                  value={editedParticipant.studentId || ""}
                  readOnly
                  className="col-span-3"
                />
              </div>
            )}

            {/* Common fields for all participant types */}
            <div className="grid grid-cols-4 items-center gap-4">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Label htmlFor="name" className="text-right">
                      Name
                    </Label>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Full name of the participant</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <Input
                id="name"
                value={editedParticipant.name || ""}
                onChange={(e) =>
                  setEditedParticipant({
                    ...editedParticipant,
                    name: capitalizeWords(e.target.value),
                  })
                }
                className="col-span-3"
                placeholder="Enter full name"
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name}</p>
              )}
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Label htmlFor="sex" className="text-right">
                      Sex at Birth
                    </Label>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Biological sex of the participant</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <Select
                value={editedParticipant.sex || ""}
                onValueChange={(value) =>
                  setEditedParticipant({ ...editedParticipant, sex: value })
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
              {errors.sex && (
                <p className="text-sm text-red-500">{errors.sex}</p>
              )}
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Label htmlFor="age" className="text-right">
                      Age
                    </Label>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Current age of the participant</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <Input
                id="age"
                type="number"
                value={editedParticipant.age || ""}
                onChange={(e) =>
                  setEditedParticipant({
                    ...editedParticipant,
                    age: e.target.value,
                  })
                }
                className="col-span-3"
                placeholder="Enter age"
              />
              {errors.age && (
                <p className="text-sm text-red-500">{errors.age}</p>
              )}
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Label htmlFor="address" className="text-right">
                      Address
                    </Label>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Current residential address</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <Input
                id="address"
                value={editedParticipant.address || ""}
                onChange={(e) =>
                  setEditedParticipant({
                    ...editedParticipant,
                    address: e.target.value,
                  })
                }
                className="col-span-3"
                placeholder="Enter address"
              />
              {errors.address && (
                <p className="text-sm text-red-500">{errors.address}</p>
              )}
            </div>

            {/* Student-specific fields */}
            {participantType === "student" && (
              <>
                <div className="grid grid-cols-4 items-center gap-4">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Label htmlFor="school" className="text-right">
                          School
                        </Label>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Academic school or department</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <Select
                    value={editedParticipant.school || ""}
                    onValueChange={(value) =>
                      setEditedParticipant({
                        ...editedParticipant,
                        school: value,
                      })
                    }
                  >
                    <SelectTrigger className="col-span-3">
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
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Label htmlFor="year" className="text-right">
                          Year
                        </Label>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Current year level</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <Select
                    value={editedParticipant.year || ""}
                    onValueChange={(value) =>
                      setEditedParticipant({
                        ...editedParticipant,
                        year: value,
                      })
                    }
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select year" />
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
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Label htmlFor="section" className="text-right">
                          Section
                        </Label>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Current class section</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <Input
                    id="section"
                    value={editedParticipant.section || ""}
                    onChange={(e) =>
                      setEditedParticipant({
                        ...editedParticipant,
                        section: capitalizeWords(e.target.value),
                      })
                    }
                    className="col-span-3"
                    placeholder="Enter section"
                  />
                </div>
              </>
            )}

            {/* Ethnic Group field - common for all types */}
            <div className="grid grid-cols-4 items-center gap-4">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Label htmlFor="ethnicGroup" className="text-right">
                      Ethnic Group
                    </Label>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Participant's ethnic or cultural group</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <Select
                value={editedParticipant.ethnicGroup || ""}
                onValueChange={(value) =>
                  setEditedParticipant({
                    ...editedParticipant,
                    ethnicGroup: value,
                    otherEthnicGroup:
                      value === "Other"
                        ? editedParticipant.otherEthnicGroup || ""
                        : "",
                  })
                }
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select ethnic group">
                    {editedParticipant.ethnicGroup === "Other"
                      ? editedParticipant.otherEthnicGroup
                      : editedParticipant.ethnicGroup || "Select ethnic group"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Tagalog">Tagalog</SelectItem>
                  <SelectItem value="Cebuano">Cebuano</SelectItem>
                  <SelectItem value="Ilocano">Ilocano</SelectItem>
                  <SelectItem value="Bicolano">Bicolano</SelectItem>
                  <SelectItem value="Waray">Waray</SelectItem>
                  <SelectItem value="Kapampangan">Kapampangan</SelectItem>
                  <SelectItem value="Pangasinan">Pangasinan</SelectItem>
                  <SelectItem value="Ilonggo">Ilonggo</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
              {errors.ethnicGroup && (
                <p className="text-sm text-red-500">{errors.ethnicGroup}</p>
              )}
            </div>

            {/* Other Ethnic Group field - shown when "Other" is selected */}
            {editedParticipant.ethnicGroup === "Other" && (
              <div className="grid grid-cols-4 items-center gap-4">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Label htmlFor="otherEthnicGroup" className="text-right">
                        Specify Ethnic Group
                      </Label>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Specify the ethnic group if not in the list</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <Input
                  id="otherEthnicGroup"
                  value={editedParticipant.otherEthnicGroup || ""}
                  onChange={(e) =>
                    setEditedParticipant({
                      ...editedParticipant,
                      otherEthnicGroup: capitalizeWords(e.target.value),
                    })
                  }
                  className="col-span-3"
                  placeholder="Enter ethnic group"
                  required
                />
                {errors.otherEthnicGroup && (
                  <p className="text-sm text-red-500">
                    {errors.otherEthnicGroup}
                  </p>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button onClick={handleSaveChanges}>Save changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Show unsaved changes dialog only when there are actual changes */}
      {showUnsavedDialog && hasUnsavedChanges && (
        <AlertDialog
          open={showUnsavedDialog}
          onOpenChange={setShowUnsavedDialog}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
              <AlertDialogDescription>
                You have unsaved changes. Do you want to save them before
                closing?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogAction
                onClick={handleDiscardChanges}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Discard Changes
              </AlertDialogAction>
              <AlertDialogAction onClick={handleSaveChanges}>
                Save Changes
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
}
