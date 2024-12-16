// src/app/officer/event-management/participant-management/delete-participant-dialog/page.jsx
import React, { useState, useEffect } from "react";
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
import { Trash2, Loader2 } from "lucide-react";
import { toast } from "react-toastify";
import { deleteParticipant, getCurrentUser } from "@/lib/appwrite";

export default function DeleteParticipantDialog({
  participant,
  onDeleteParticipant,
}) {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const initUser = async () => {
      try {
        const user = await getCurrentUser();
        setCurrentUser(user);
      } catch (error) {
        console.error("Error getting current user:", error);
      }
    };

    initUser();
  }, []);

  const handleDeleteParticipant = async () => {
    if (!currentUser) {
      toast.error("Please wait while we verify your session");
      return;
    }

    setIsLoading(true);
    try {
      await deleteParticipant(participant.$id, currentUser.$id);
      onDeleteParticipant(participant.$id);
      toast.success("Participant deleted successfully");
      setIsOpen(false);
    } catch (error) {
      console.error("Error deleting participant:", error);
      if (error.message.includes("permission")) {
        toast.error("You do not have permission to delete this participant");
      } else {
        toast.error("Failed to delete participant. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
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
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDeleteParticipant}
            disabled={isLoading || !currentUser}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              "Delete"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
