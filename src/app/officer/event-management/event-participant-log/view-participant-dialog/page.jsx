import React, { useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { Trash2 } from "lucide-react";
import EditParticipantDialog from "./edit-participant-dialog/page";
import AddParticipant from "../add-participant-dialog/page";

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
  participants,
  selectedEvent,
  onAddParticipant,
  onDeleteParticipant,
}) => {
  const filteredParticipants = participants.filter(
    (p) => p.eventId === selectedEvent?.$id
  );

  const studentParticipants = filteredParticipants.filter((p) => p.studentId);
  const staffParticipants = filteredParticipants.filter(
    (p) => p.staffFacultyId
  );
  const communityParticipants = filteredParticipants.filter(
    (p) => !p.studentId && !p.staffFacultyId
  );

  const summary = useMemo(() => {
    const total = filteredParticipants.length;
    const maleCount = filteredParticipants.filter(
      (p) => p.sex === "Male"
    ).length;
    const femaleCount = filteredParticipants.filter(
      (p) => p.sex === "Female"
    ).length;
    return { total, maleCount, femaleCount };
  }, [filteredParticipants]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>
            Participants for {selectedEvent?.eventName || "Event"}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{summary.total}</div>
              <div className="text-sm text-muted-foreground">
                Total Participants
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{summary.maleCount}</div>
              <div className="text-sm text-muted-foreground">
                Male Participants
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{summary.femaleCount}</div>
              <div className="text-sm text-muted-foreground">
                Female Participants
              </div>
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
              Students ({studentParticipants.length})
            </TabsTrigger>
            <TabsTrigger value="staff">
              Staff/Faculty ({staffParticipants.length})
            </TabsTrigger>
            <TabsTrigger value="community">
              Community ({communityParticipants.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="students">
            <div className="max-h-[330px] overflow-y-auto">
              {studentParticipants.length > 0 ? (
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
                    {studentParticipants.map((participant) => (
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
                          <div className="flex space-x-2">
                            <EditParticipantDialog
                              participant={participant}
                              onUpdateParticipant={onAddParticipant}
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                onDeleteParticipant(participant.$id)
                              }
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
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
              {staffParticipants.length > 0 ? (
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
                    {staffParticipants.map((participant) => (
                      <TableRow key={participant.$id}>
                        <TableCell>{participant.staffFacultyId}</TableCell>
                        <TableCell>{participant.name}</TableCell>
                        <TableCell>{participant.sex}</TableCell>
                        <TableCell>{participant.age}</TableCell>
                        <TableCell>{participant.address}</TableCell>
                        <TableCell>{participant.ethnicGroup}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <EditParticipantDialog
                              participant={participant}
                              onUpdateParticipant={onAddParticipant}
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                onDeleteParticipant(participant.$id)
                              }
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
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
                          <div className="flex space-x-2">
                            <EditParticipantDialog
                              participant={participant}
                              onUpdateParticipant={onAddParticipant}
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                onDeleteParticipant(participant.$id)
                              }
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
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
      </DialogContent>
    </Dialog>
  );
};

export default ViewParticipants;
