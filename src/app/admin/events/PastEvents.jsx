// src/app/admin/events/past-events/page.jsx
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Edit, Trash2, Eye, Check, X } from "lucide-react";
import { databases, getCurrentUser } from "@/lib/appwrite";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function PastEvents() {
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [creators, setCreators] = useState({});
  const { toast } = useToast();
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [approvalAction, setApprovalAction] = useState(null);
  const [user, setUser] = useState(null); // Add this state
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedEventForAction, setSelectedEventForAction] = useState(null);

  useEffect(() => {
    const initializeUser = async () => {
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        console.error("Error getting current user:", error);
        toast({
          title: "Error",
          description: "Failed to authenticate user",
          variant: "destructive",
        });
      }
    };

    initializeUser();
  }, []);

  const fetchUserDetails = async (userId) => {
    try {
      const response = await databases.getDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
        process.env.NEXT_PUBLIC_APPWRITE_USER_COLLECTION_ID,
        userId
      );
      return response;
    } catch (error) {
      console.error("Error fetching user details:", error);
      return null;
    }
  };

  const fetchEvents = async () => {
    try {
      const response = await databases.listDocuments(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
        process.env.NEXT_PUBLIC_APPWRITE_EVENT_COLLECTION_ID
      );

      // Sort events by date in descending order and filter for past events
      const pastEvents = response.documents
        .filter((event) => new Date(event.eventDate) < new Date())
        .sort((a, b) => new Date(b.eventDate) - new Date(a.eventDate));

      // Fetch creator details for each event
      const creatorDetails = {};
      await Promise.all(
        pastEvents.map(async (event) => {
          if (event.createdBy) {
            const creator = await fetchUserDetails(event.createdBy);
            if (creator) {
              creatorDetails[event.createdBy] = creator;
            }
          }
        })
      );

      setCreators(creatorDetails);
      setEvents(pastEvents);
    } catch (error) {
      console.error("Error fetching events:", error);
      toast({
        title: "Error",
        description: "Failed to fetch events",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleStatusUpdate = async (event, status) => {
    setSelectedEvent(event);
    setApprovalAction(status);
    setShowApprovalDialog(true);
  };

  const confirmStatusUpdate = async () => {
    if (!selectedEvent || !approvalAction || !user) {
      toast({
        title: "Error",
        description: "Missing required information",
        variant: "destructive",
      });
      return;
    }

    try {
      // Update the document
      await databases.updateDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
        process.env.NEXT_PUBLIC_APPWRITE_EVENT_COLLECTION_ID,
        selectedEvent.$id,
        {
          approvalStatus: approvalAction,
          createdBy: user.$id,
        }
      );

      // Update local state
      setEvents(
        events.map((event) =>
          event.$id === selectedEvent.$id
            ? { ...event, status: approvalAction }
            : event
        )
      );

      toast({
        title: "Success",
        description: `Event ${
          approvalAction === "approved" ? "approved" : "set to pending"
        } successfully`,
      });
    } catch (error) {
      console.error("Error updating event status:", error);
      toast({
        title: "Error",
        description: "Failed to update event status",
        variant: "destructive",
      });
    } finally {
      setShowApprovalDialog(false);
      setSelectedEvent(null);
      setApprovalAction(null);
    }
  };

  const handleView = (event) => {
    setSelectedEventForAction(event);
    setShowViewDialog(true);
  };

  const handleEdit = (event) => {
    setSelectedEventForAction(event);
    setShowEditDialog(true);
  };

  const handleDelete = (event) => {
    setSelectedEventForAction(event);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    try {
      await databases.deleteDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
        process.env.NEXT_PUBLIC_APPWRITE_EVENT_COLLECTION_ID,
        selectedEventForAction.$id
      );
      toast({
        title: "Success",
        description: "Event deleted successfully",
      });
      fetchEvents(); // Refresh the list
    } catch (error) {
      console.error("Error deleting event:", error);
      toast({
        title: "Error",
        description: "Failed to delete event",
        variant: "destructive",
      });
    } finally {
      setShowDeleteDialog(false);
      setSelectedEventForAction(null);
    }
  };

  const getCreatorInfo = (createdBy) => {
    const creator = creators[createdBy];
    return creator ? (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <div className="flex items-center space-x-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={creator.avatarUrl} alt={creator.name} />
                <AvatarFallback>
                  {creator.name
                    ?.split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm">{creator.name}</span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Created by: {creator.name}</p>
            <p>Email: {creator.email}</p>
            <p>Role: {creator.role}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    ) : (
      <span className="text-muted">Unknown</span>
    );
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Past Events</CardTitle>
          <CardDescription>View and analyze past events.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Event Name</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Participants</TableHead>
                <TableHead>Created By</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.map((event) => (
                <TableRow key={event.$id}>
                  <TableCell>{event.eventName}</TableCell>
                  <TableCell>
                    {new Date(event.eventDate).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </TableCell>
                  <TableCell>{event.eventVenue}</TableCell>
                  <TableCell>{event.participantCount || 0}</TableCell>
                  <TableCell>{getCreatorInfo(event.createdBy)}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleView(event)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(event)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(event)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      {event.status !== "approved" ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleStatusUpdate(event, "approved")}
                          className="text-green-600 hover:text-green-700"
                          disabled={!user}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleStatusUpdate(event, "pending")}
                          className="text-yellow-600 hover:text-yellow-700"
                          disabled={!user}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    <AlertDialog
                      open={showApprovalDialog}
                      onOpenChange={setShowApprovalDialog}
                    >
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            Confirm Status Update
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to{" "}
                            {approvalAction === "approved"
                              ? "approve"
                              : "set to pending"}{" "}
                            this event?
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel
                            onClick={() => setShowApprovalDialog(false)}
                          >
                            Cancel
                          </AlertDialogCancel>
                          <AlertDialogAction onClick={confirmStatusUpdate}>
                            Confirm
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* View Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Event Details</DialogTitle>
            <DialogDescription>
              Detailed information about the event
            </DialogDescription>
          </DialogHeader>
          {selectedEventForAction && (
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div>
                      <span className="font-semibold">Event Name:</span>
                      <p>{selectedEventForAction.eventName}</p>
                    </div>
                    <div>
                      <span className="font-semibold">Date:</span>
                      <p>
                        {new Date(
                          selectedEventForAction.eventDate
                        ).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                    <div>
                      <span className="font-semibold">Venue:</span>
                      <p>{selectedEventForAction.eventVenue}</p>
                    </div>
                    <div>
                      <span className="font-semibold">Type:</span>
                      <p>{selectedEventForAction.eventType}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Additional Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div>
                      <span className="font-semibold">Status:</span>
                      <p
                        className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${
                          selectedEventForAction.status === "approved"
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {selectedEventForAction.status || "Pending"}
                      </p>
                    </div>
                    <div>
                      <span className="font-semibold">Created By:</span>
                      <p>{getCreatorInfo(selectedEventForAction.createdBy)}</p>
                    </div>
                    <div>
                      <span className="font-semibold">Created At:</span>
                      <p>
                        {new Date(
                          selectedEventForAction.$createdAt
                        ).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <span className="font-semibold">Description:</span>
                      <p>{selectedEventForAction.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="col-span-2">
                <CardHeader>
                  <CardTitle>Participant Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <span className="font-semibold">Total Participants:</span>
                      <p className="text-2xl font-bold">
                        {selectedEventForAction.participantCount || 0}
                      </p>
                    </div>
                    {/* Add more participant statistics here if available */}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Confirmation Dialog */}
      <AlertDialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Edit Event</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to edit this event?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowEditDialog(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                // Implement your edit logic here
                console.log("Edit event:", selectedEventForAction);
                setShowEditDialog(false);
              }}
            >
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Event</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this event? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
