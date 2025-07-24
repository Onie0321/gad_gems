"use client";
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
import { Loader2 } from "lucide-react";

export default function EditParticipantDialog({
  participant,
  onUpdateParticipant,
}) {
  const [editedParticipant, setEditedParticipant] = useState({
    name: participant.name || "",
    studentId: participant.studentId || "",
    staffFacultyId: participant.staffFacultyId || "",
    sex: participant.sex || "",
    age: participant.age || "",
    address: participant.address || "",
    school: participant.school || "",
    year: participant.year || "",
    section: participant.section || "",
    ethnicGroup: participant.ethnicGroup || "",
    otherEthnicGroup: participant.otherEthnicGroup || "",
    orientation: participant.orientation || "",
    religion: participant.religion || "",
    firstGen: participant.firstGen || "",
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false); // Control dialog visibility

  const handleSaveChanges = async () => {
    const validationErrors = validateEditParticipantForm(editedParticipant);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      toast.error("Please fix the errors before saving.");
      return;
    }

    try {
      // Clean the participant data by removing Appwrite system fields
      const cleanParticipant = { ...editedParticipant };
      // Remove all Appwrite system fields
      delete cleanParticipant.$id;
      delete cleanParticipant.$createdAt;
      delete cleanParticipant.$updatedAt;
      delete cleanParticipant.$permissions;
      delete cleanParticipant.$collectionId;
      delete cleanParticipant.$databaseId;
      delete cleanParticipant.$read;
      delete cleanParticipant.$write;

      // Keep only the fields we want to update
      const updateData = {
        name: cleanParticipant.name,
        sex: cleanParticipant.sex,
        age: cleanParticipant.age,
        school: cleanParticipant.school,
        year: cleanParticipant.year,
        section: cleanParticipant.section,
        ethnicGroup: cleanParticipant.ethnicGroup,
        otherEthnicGroup: cleanParticipant.otherEthnicGroup,
        eventId: cleanParticipant.eventId,
        createdBy: cleanParticipant.createdBy,
        academicPeriodId: cleanParticipant.academicPeriodId,
        isArchived: cleanParticipant.isArchived || false,
      };

      // Update the participant in the database
      await updateParticipant(participant.$id, updateData);
      onUpdateParticipant(cleanParticipant); // Update local state
      toast.success("Participant updated successfully");
      setIsDialogOpen(false); // Close the dialog
    } catch (error) {
      console.error("Update error:", error);
      toast.error("Failed to update participant. Please try again.");
    }
  };

  const handleInputChange = (field, value) => {
    setEditedParticipant((prev) => ({
      ...prev,
      [field]: value,
    }));
    setHasChanges(true);
  };

  const handleClose = () => {
    setIsDialogOpen(false);
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Participant</DialogTitle>
          <DialogDescription>
            Update the details for this participant.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4">
          {/* Left Column */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={editedParticipant.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                className={errors.name ? "border-red-500" : ""}
              />
              {errors.name && (
                <p className="text-red-500 text-sm mt-1">{errors.name}</p>
              )}
            </div>

            <div>
              <Label htmlFor="sex">Sex</Label>
              <Select
                value={editedParticipant.sex}
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
                type="number"
                value={editedParticipant.age}
                onChange={(e) => handleInputChange("age", e.target.value)}
                className={errors.age ? "border-red-500" : ""}
              />
              {errors.age && (
                <p className="text-red-500 text-sm mt-1">{errors.age}</p>
              )}
            </div>

            <div>
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={editedParticipant.address}
                onChange={(e) => handleInputChange("address", e.target.value)}
                className={errors.address ? "border-red-500" : ""}
              />
              {errors.address && (
                <p className="text-red-500 text-sm mt-1">{errors.address}</p>
              )}
            </div>

            <div>
              <Label htmlFor="orientation">Sexual Orientation</Label>
              <Select
                value={editedParticipant.orientation}
                onValueChange={(value) =>
                  handleInputChange("orientation", value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select sexual orientation" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Straight">Straight</SelectItem>
                  <SelectItem value="Bi-Sexual">Bi-Sexual</SelectItem>
                  <SelectItem value="Lesbian">Lesbian</SelectItem>
                </SelectContent>
              </Select>
              {errors.orientation && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.orientation}
                </p>
              )}
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            {participant.studentId && (
              <>
                <div>
                  <Label htmlFor="studentId">Student ID</Label>
                  <Input
                    id="studentId"
                    value={editedParticipant.studentId}
                    onChange={(e) =>
                      handleInputChange("studentId", e.target.value)
                    }
                    className={errors.studentId ? "border-red-500" : ""}
                  />
                  {errors.studentId && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.studentId}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="school">School</Label>
                  <Select
                    value={editedParticipant.school}
                    onValueChange={(value) =>
                      handleInputChange("school", value)
                    }
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
                    value={editedParticipant.year}
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
                    value={editedParticipant.section}
                    onChange={(e) =>
                      handleInputChange("section", e.target.value)
                    }
                    className={errors.section ? "border-red-500" : ""}
                  />
                  {errors.section && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.section}
                    </p>
                  )}
                </div>
              </>
            )}

            {participant.staffFacultyId && (
              <div>
                <Label htmlFor="staffFacultyId">Staff/Faculty ID</Label>
                <Input
                  id="staffFacultyId"
                  value={editedParticipant.staffFacultyId}
                  onChange={(e) =>
                    handleInputChange("staffFacultyId", e.target.value)
                  }
                  className={errors.staffFacultyId ? "border-red-500" : ""}
                />
                {errors.staffFacultyId && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.staffFacultyId}
                  </p>
                )}
              </div>
            )}

            <div>
              <Label htmlFor="religion">Religion</Label>
              <Input
                id="religion"
                value={editedParticipant.religion}
                onChange={(e) => handleInputChange("religion", e.target.value)}
                className={errors.religion ? "border-red-500" : ""}
              />
              {errors.religion && (
                <p className="text-red-500 text-sm mt-1">{errors.religion}</p>
              )}
            </div>

            <div>
              <Label htmlFor="firstGen">First Generation Student</Label>
              <Select
                value={editedParticipant.firstGen}
                onValueChange={(value) => handleInputChange("firstGen", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select option" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Yes">Yes</SelectItem>
                  <SelectItem value="No">No</SelectItem>
                </SelectContent>
              </Select>
              {errors.firstGen && (
                <p className="text-red-500 text-sm mt-1">{errors.firstGen}</p>
              )}
            </div>

            <div>
              <Label htmlFor="ethnicGroup">Ethnic Group</Label>
              <Select
                value={editedParticipant.ethnicGroup}
                onValueChange={(value) => {
                  handleInputChange("ethnicGroup", value);
                  if (value !== "Other") {
                    setEditedParticipant((prev) => ({
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
                  <SelectItem value="Tagalog">Tagalog</SelectItem>
                  <SelectItem value="Cebuano">Cebuano</SelectItem>
                  <SelectItem value="Ilocano">Ilocano</SelectItem>
                  <SelectItem value="Bicolano">Bicolano</SelectItem>
                  <SelectItem value="Waray">Waray</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
              {errors.ethnicGroup && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.ethnicGroup}
                </p>
              )}
            </div>

            {editedParticipant.ethnicGroup === "Other" && (
              <div>
                <Label htmlFor="otherEthnicGroup">Specify Ethnic Group</Label>
                <Input
                  id="otherEthnicGroup"
                  value={editedParticipant.otherEthnicGroup}
                  onChange={(e) =>
                    handleInputChange("otherEthnicGroup", e.target.value)
                  }
                  className={errors.otherEthnicGroup ? "border-red-500" : ""}
                />
                {errors.otherEthnicGroup && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.otherEthnicGroup}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSaveChanges}
            disabled={isSubmitting || !hasChanges}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
