"use client";
import React, { useMemo, useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import EditParticipantDialog from "./EditParticipantDialog";
import AddParticipant from "../AddParticipantDialog";
import {
  databases,
  databaseId,
  studentCollectionId,
  staffFacultyCollectionId,
  communityCollectionId,
} from "@/lib/appwrite";
import { Query } from "appwrite";
import { Loader2 } from "lucide-react";
import { Edit } from "lucide-react";
import { DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

const EmptyState = ({ message }) => (
  <div className="flex flex-col items-center justify-center py-8 text-center">
    <p className="text-gray-500 mb-2">{message}</p>
    <p className="text-sm text-gray-400">
      Click the "Add Participant" button above to add new participants
    </p>
  </div>
);

const ViewParticipants = ({
  isOpen,
  onClose,
  selectedEvent,
  onEditParticipant,
  onAddParticipant,
}) => {
  const [loading, setLoading] = useState(true);
  const [eventParticipants, setEventParticipants] = useState([]);
  const [staffFacultyParticipants, setStaffFacultyParticipants] = useState([]);
  const [communityParticipants, setCommunityParticipants] = useState([]);

  // Fetch participants for the selected event
  useEffect(() => {
    const fetchEventParticipants = async () => {
      if (!selectedEvent) {
        console.log("No selected event");
        return;
      }

      try {
        setLoading(true);
        console.log("Fetching participants for event:", selectedEvent.$id);

        // Remove the participantType filter since it might not be set for created events
        const [studentsResponse, staffResponse, communityResponse] =
          await Promise.all([
            databases.listDocuments(databaseId, studentCollectionId, [
              Query.equal("eventId", selectedEvent.$id),
              Query.equal("isArchived", false), // Add this if needed
            ]),
            databases.listDocuments(databaseId, staffFacultyCollectionId, [
              Query.equal("eventId", selectedEvent.$id),
              Query.equal("isArchived", false), // Add this if needed
            ]),
            databases.listDocuments(databaseId, communityCollectionId, [
              Query.equal("eventId", selectedEvent.$id),
              Query.equal("isArchived", false), // Add this if needed
            ]),
          ]);

        // Store the fetched data in their respective state variables
        setEventParticipants(studentsResponse.documents);
        setStaffFacultyParticipants(staffResponse.documents);
        setCommunityParticipants(communityResponse.documents);

        console.log("Fetched participants:", {
          students: studentsResponse.documents.length,
          staff: staffResponse.documents.length,
          community: communityResponse.documents.length,
          total:
            studentsResponse.documents.length +
            staffResponse.documents.length +
            communityResponse.documents.length,
        });
      } catch (error) {
        console.error("Error fetching participants:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEventParticipants();
  }, [selectedEvent]);

  // Calculate summary including all participant types
  const summary = useMemo(() => {
    const allParticipants = [
      ...eventParticipants,
      ...staffFacultyParticipants,
      ...communityParticipants,
    ];

    const total = allParticipants.length;
    const maleCount = allParticipants.filter((p) => p.sex === "Male").length;
    const femaleCount = allParticipants.filter(
      (p) => p.sex === "Female"
    ).length;

    return {
      total,
      maleCount,
      femaleCount,
      studentCount: eventParticipants.length,
      staffCount: staffFacultyParticipants.length,
      communityCount: communityParticipants.length,
    };
  }, [eventParticipants, staffFacultyParticipants, communityParticipants]);

  const handleEditParticipant = (participant) => {
    // Implement the logic to edit the participant
    console.log("Editing participant:", participant);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>View Participants</DialogTitle>
          <DialogDescription>
            View and manage participants for {selectedEvent?.eventName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Event Details Card */}
          <Card>
            <CardHeader>
              <CardTitle>Event Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Event Name</Label>
                  <p className="text-sm text-muted-foreground">
                    {selectedEvent?.eventName}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Date</Label>
                  <p className="text-sm text-muted-foreground">
                    {selectedEvent?.date
                      ? new Date(selectedEvent.date).toLocaleDateString()
                      : "N/A"}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Venue</Label>
                  <p className="text-sm text-muted-foreground">
                    {selectedEvent?.venue || "N/A"}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <p className="text-sm text-muted-foreground">
                    {selectedEvent?.status || "N/A"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Participant Tabs */}
          <Tabs defaultValue="students" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="students">
                Students ({eventParticipants.length})
              </TabsTrigger>
              <TabsTrigger value="staff">
                Staff/Faculty ({staffFacultyParticipants.length})
              </TabsTrigger>
              <TabsTrigger value="community">
                Community ({communityParticipants.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="students" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Student Participants</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Student ID</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Sex</TableHead>
                          <TableHead>Age</TableHead>
                          <TableHead>School</TableHead>
                          <TableHead>Year</TableHead>
                          <TableHead>Section</TableHead>
                          <TableHead>Ethnic Group</TableHead>
                          <TableHead>Sexual Orientation</TableHead>
                          <TableHead>Religion</TableHead>
                          <TableHead>First Generation</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {eventParticipants.map((participant) => (
                          <TableRow key={participant.$id}>
                            <TableCell>{participant.studentId}</TableCell>
                            <TableCell>{participant.name}</TableCell>
                            <TableCell>{participant.sex}</TableCell>
                            <TableCell>{participant.age}</TableCell>
                            <TableCell>{participant.school}</TableCell>
                            <TableCell>{participant.year}</TableCell>
                            <TableCell>{participant.section}</TableCell>
                            <TableCell>
                              {participant.ethnicGroup === "Other"
                                ? participant.otherEthnicGroup
                                : participant.ethnicGroup}
                            </TableCell>
                            <TableCell>{participant.orientation}</TableCell>
                            <TableCell>{participant.religion}</TableCell>
                            <TableCell>{participant.firstGen}</TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() =>
                                  handleEditParticipant(participant)
                                }
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="staff" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Staff/Faculty Participants</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Staff/Faculty ID</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Sex</TableHead>
                          <TableHead>Age</TableHead>
                          <TableHead>Ethnic Group</TableHead>
                          <TableHead>Sexual Orientation</TableHead>
                          <TableHead>Religion</TableHead>
                          <TableHead>First Generation</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {staffFacultyParticipants.map((participant) => (
                          <TableRow key={participant.$id}>
                            <TableCell>{participant.staffFacultyId}</TableCell>
                            <TableCell>{participant.name}</TableCell>
                            <TableCell>{participant.sex}</TableCell>
                            <TableCell>{participant.age}</TableCell>
                            <TableCell>
                              {participant.ethnicGroup === "Other"
                                ? participant.otherEthnicGroup
                                : participant.ethnicGroup}
                            </TableCell>
                            <TableCell>{participant.orientation}</TableCell>
                            <TableCell>{participant.religion}</TableCell>
                            <TableCell>{participant.firstGen}</TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() =>
                                  handleEditParticipant(participant)
                                }
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="community" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Community Participants</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Sex</TableHead>
                          <TableHead>Age</TableHead>
                          <TableHead>Address</TableHead>
                          <TableHead>Ethnic Group</TableHead>
                          <TableHead>Sexual Orientation</TableHead>
                          <TableHead>Religion</TableHead>
                          <TableHead>First Generation</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {communityParticipants.map((participant) => (
                          <TableRow key={participant.$id}>
                            <TableCell>{participant.name}</TableCell>
                            <TableCell>{participant.sex}</TableCell>
                            <TableCell>{participant.age}</TableCell>
                            <TableCell>{participant.address}</TableCell>
                            <TableCell>
                              {participant.ethnicGroup === "Other"
                                ? participant.otherEthnicGroup
                                : participant.ethnicGroup}
                            </TableCell>
                            <TableCell>{participant.orientation}</TableCell>
                            <TableCell>{participant.religion}</TableCell>
                            <TableCell>{participant.firstGen}</TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() =>
                                  handleEditParticipant(participant)
                                }
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ViewParticipants;
