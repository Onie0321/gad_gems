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
import { Card, CardContent } from "@/components/ui/card";
import EditParticipantDialog from "./edit-participant-dialog/page";
import AddParticipant from "../add-participant-dialog/page";
import { databases, databaseId, participantCollectionId, staffFacultyCollectionId, communityCollectionId } from "@/lib/appwrite";
import { Query } from "appwrite";
import { Loader2 } from "lucide-react";

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
        const [studentsResponse, staffResponse, communityResponse] = await Promise.all([
          databases.listDocuments(
            databaseId,
            participantCollectionId,
            [
              Query.equal("eventId", selectedEvent.$id),
              Query.equal("isArchived", false) // Add this if needed
            ]
          ),
          databases.listDocuments(
            databaseId,
            staffFacultyCollectionId,
            [
              Query.equal("eventId", selectedEvent.$id),
              Query.equal("isArchived", false) // Add this if needed
            ]
          ),
          databases.listDocuments(
            databaseId,
            communityCollectionId,
            [
              Query.equal("eventId", selectedEvent.$id),
              Query.equal("isArchived", false) // Add this if needed
            ]
          )
        ]);
        
        // Store the fetched data in their respective state variables
        setEventParticipants(studentsResponse.documents);
        setStaffFacultyParticipants(staffResponse.documents);
        setCommunityParticipants(communityResponse.documents);

        console.log("Fetched participants:", {
          students: studentsResponse.documents.length,
          staff: staffResponse.documents.length,
          community: communityResponse.documents.length,
          total: studentsResponse.documents.length + 
                 staffResponse.documents.length + 
                 communityResponse.documents.length
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
      ...communityParticipants
    ];

    const total = allParticipants.length;
    const maleCount = allParticipants.filter(p => p.sex === "Male").length;
    const femaleCount = allParticipants.filter(p => p.sex === "Female").length;

    return {
      total,
      maleCount,
      femaleCount,
      studentCount: eventParticipants.length,
      staffCount: staffFacultyParticipants.length,
      communityCount: communityParticipants.length
    };
  }, [eventParticipants, staffFacultyParticipants, communityParticipants]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>
            Participants for {selectedEvent?.eventName || "Event"}
          </DialogTitle>
          <DialogDescription>
            View and manage participants for this event
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center p-4">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-purple-700">{summary.total}</div>
                  <div className="text-sm text-purple-600">Total Participants</div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-blue-700">{summary.maleCount}</div>
                  <div className="text-sm text-blue-600">Male Participants</div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-pink-50 to-pink-100 border-pink-200">
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-pink-700">{summary.femaleCount}</div>
                  <div className="text-sm text-pink-600">Female Participants</div>
                </CardContent>
              </Card>
            </div>

            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Participant List</h3>
              <AddParticipant
                onAddParticipant={onAddParticipant}
                eventId={selectedEvent?.$id}
                isEventSelected={!!selectedEvent}
                currentEvent={selectedEvent}
              />
            </div>

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

              <TabsContent value="students">
                <div className="max-h-[330px] overflow-y-auto">
                  {eventParticipants.length > 0 ? (
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
                          <TableHead>Actions</TableHead>
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
                            <TableCell>{participant.ethnicGroup}</TableCell>
                            <TableCell>
                              <EditParticipantDialog
                                participant={participant}
                                onUpdateParticipant={onAddParticipant}
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <EmptyState message="No student participants found" />
                  )}
                </div>
              </TabsContent>

              <TabsContent value="staff">
                <div className="max-h-[330px] overflow-y-auto">
                  {staffFacultyParticipants.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Staff/Faculty ID</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Sex</TableHead>
                          <TableHead>Age</TableHead>
                          <TableHead>Address</TableHead>
                          <TableHead>Ethnic Group</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {staffFacultyParticipants.map((participant) => (
                          <TableRow key={participant.$id}>
                            <TableCell>{participant.staffFacultyId}</TableCell>
                            <TableCell>{participant.name}</TableCell>
                            <TableCell>{participant.sex}</TableCell>
                            <TableCell>{participant.age}</TableCell>
                            <TableCell>{participant.address}</TableCell>
                            <TableCell>{participant.ethnicGroup}</TableCell>
                            <TableCell>
                              <EditParticipantDialog
                                participant={participant}
                                onUpdateParticipant={onAddParticipant}
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <EmptyState message="No staff/faculty participants found" />
                  )}
                </div>
              </TabsContent>

              <TabsContent value="community">
                <div className="max-h-[330px] overflow-y-auto">
                  {communityParticipants.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Sex</TableHead>
                          <TableHead>Age</TableHead>
                          <TableHead>Address</TableHead>
                          <TableHead>Ethnic Group</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {communityParticipants.map((participant) => (
                          <TableRow key={participant.$id}>
                            <TableCell>{participant.name}</TableCell>
                            <TableCell>{participant.sex}</TableCell>
                            <TableCell>{participant.age}</TableCell>
                            <TableCell>{participant.address}</TableCell>
                            <TableCell>{participant.ethnicGroup}</TableCell>
                            <TableCell>
                              <EditParticipantDialog
                                participant={participant}
                                onUpdateParticipant={onAddParticipant}
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <EmptyState message="No community participants found" />
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ViewParticipants;
