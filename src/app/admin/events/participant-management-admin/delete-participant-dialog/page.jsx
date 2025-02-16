"use client";
import React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Trash2 } from "lucide-react";
import { toast } from "react-toastify";
import { deleteParticipant } from "@/lib/appwrite";

export default function DeleteParticipantDialog({
  participant,
  onDeleteParticipant,
}) {
  const handleDeleteParticipant = async () => {
    try {
      await deleteParticipant(participant.$id); // Delete from the database
      onDeleteParticipant(participant.$id); // Update the state
      toast.success("Participant deleted successfully");
    } catch (error) {
      console.error("Error deleting participant:", error.message);
      if (error.message.includes("not authorized")) {
        toast.error(
          "You do not have permission to delete this participant. Please contact an administrator."
        );
      } else {
        toast.error("Failed to delete participant. Please try again.");
      }
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Trash2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Participant</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this participant? This action cannot
            be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogTrigger asChild>
            <Button variant="outline">Cancel</Button>
          </DialogTrigger>
          <Button variant="destructive" onClick={handleDeleteParticipant}>
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
