import React, { useState } from "react";
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
} from "../../../../../utils/participantUtils";
import { updateParticipant } from "@/lib/appwrite"; // Adjust import based on your file structure

export default function EditParticipantDialog({
  participant,
  onUpdateParticipant,
}) {
  const [editedParticipant, setEditedParticipant] = useState({
    ...participant,
  });
  const [errors, setErrors] = useState({});
  const [isDialogOpen, setIsDialogOpen] = useState(false); // Control dialog visibility

  const handleSaveChanges = async () => {
    const validationErrors = validateEditParticipantForm(editedParticipant);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      toast.error("Please fix the errors before saving.");
      return;
    }

    try {
      // Filter out system fields
      const { $id, $databaseId, $collectionId, ...validData } =
        editedParticipant;

      // Update the participant in the database
      await updateParticipant($id, validData); // Ensure $id is passed as the document ID
      onUpdateParticipant(editedParticipant); // Update local state
      toast.success("Participant updated successfully");
      setIsDialogOpen(false); // Close the dialog
    } catch (error) {
      console.error("Error updating participant:", error.message);
      toast.error("Failed to update participant. Please try again.");
    }
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Participant</DialogTitle>
          <DialogDescription>
            Update the details for this participant.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {/* Student ID */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="studentId" className="text-right">
              Student ID
            </Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="relative">
                    <Input
                      id="studentId"
                      value={participant.studentId} // Fetch only, do not include in editedParticipant
                      readOnly // Makes the input field read-only
                      className="col-span-3"
                    />
                  </div>
                </TooltipTrigger>
              </Tooltip>
            </TooltipProvider>
            {errors.studentId && (
              <p className="text-sm text-red-500">{errors.studentId}</p>
            )}
          </div>

          {/* Name */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Name
            </Label>
            <Input
              id="name"
              value={editedParticipant.name}
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

          {/* Sex */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="sex" className="text-right">
              Sex
            </Label>
            <Select
              value={editedParticipant.sex}
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
                <SelectItem value="Intersex">Intersex</SelectItem>
              </SelectContent>
            </Select>
            {errors.sex && <p className="text-sm text-red-500">{errors.sex}</p>}
          </div>

          {/* Age */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="age" className="text-right">
              Age
            </Label>
            <Input
              id="age"
              type="number"
              value={editedParticipant.age}
              onChange={(e) =>
                setEditedParticipant({
                  ...editedParticipant,
                  age: e.target.value,
                })
              }
              className="col-span-3"
              placeholder="Enter age"
            />
            {errors.age && <p className="text-sm text-red-500">{errors.age}</p>}
          </div>

          {/* School */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="school" className="text-right">
              School
            </Label>
            <Select
              value={editedParticipant.school}
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
            {errors.school && (
              <p className="text-sm text-red-500">{errors.school}</p>
            )}
          </div>

          {/* Year */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="year" className="text-right">
              Year
            </Label>
            <Select
              value={editedParticipant.year}
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
            {errors.year && (
              <p className="text-sm text-red-500">{errors.year}</p>
            )}
          </div>

          {/* Section */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="section" className="text-right">
              Section
            </Label>
            <Input
              id="section"
              value={editedParticipant.section}
              onChange={(e) =>
                setEditedParticipant({
                  ...editedParticipant,
                  section: capitalizeWords(e.target.value),
                })
              }
              className="col-span-3"
              placeholder="Enter section"
            />
            {errors.section && (
              <p className="text-sm text-red-500">{errors.section}</p>
            )}
          </div>

          {/* Ethnic Group */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="ethnicGroup" className="text-right">
              Ethnic Group
            </Label>
            <Select
              value={editedParticipant.ethnicGroup}
              onValueChange={(value) =>
                setEditedParticipant({
                  ...editedParticipant,
                  ethnicGroup: value,
                  otherEthnicGroup:
                    value === "Other" ? "" : editedParticipant.otherEthnicGroup,
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
            {errors.ethnicGroup && (
              <p className="text-sm text-red-500">{errors.ethnicGroup}</p>
            )}
          </div>

          {/* Specify Ethnic Group (if "Other") */}
          {editedParticipant.ethnicGroup === "Other" && (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="otherEthnicGroup" className="text-right">
                Specify Ethnic Group
              </Label>
              <Input
                id="otherEthnicGroup"
                value={editedParticipant.otherEthnicGroup}
                onChange={(e) =>
                  setEditedParticipant({
                    ...editedParticipant,
                    otherEthnicGroup: capitalizeWords(e.target.value),
                  })
                }
                className="col-span-3"
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
        <DialogFooter>
          <Button onClick={handleSaveChanges}>Save changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
