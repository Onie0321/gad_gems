import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trash2, Loader2 } from "lucide-react";
import { deleteEvent } from "@/lib/appwrite"; // Import the deleteEvent function
import { toast } from "react-toastify";

const DeleteEvent = ({ eventId, onDeleteEvent }) => {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      await deleteEvent(eventId); // Call the deleteEvent function
      toast.success("Event deleted successfully.");
      onDeleteEvent(eventId); // Notify parent component about the deletion
    } catch (error) {
      console.error("Error deleting event:", error);
      toast.error("Failed to delete event.");
    } finally {
      setLoading(false);
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
          <DialogTitle>Delete Event</DialogTitle>
        </DialogHeader>
        <p>Are you sure you want to delete this event? This action cannot be undone.</p>
        <DialogFooter>
          <Button
            onClick={handleDelete}
            variant="destructive"
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              "Delete"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteEvent;
