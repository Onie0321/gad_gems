import React, { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Edit, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "react-toastify";
import EditParticipantDialog from "./edit-participant-dialog/page";
import AddParticipant from "../add-participant-dialog/page"; // Adjust the path as needed

const ViewParticipants = ({
  isOpen,
  onClose,
  participants,
  selectedEvent,
  onAddParticipant,
}) => {
  const [editingParticipant, setEditingParticipant] = useState(null);

  const filteredParticipants = participants.filter(
    (p) => p.eventId === selectedEvent?.$id
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

  const onDeleteParticipant = async (participantId) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this participant?"
    );
    if (!confirmDelete) return;

    try {
      await onDeleteParticipant(participantId);
      toast.success("Participant deleted successfully!");
      onAddParticipant(null, participantId); // Pass null to indicate deletion
    } catch (error) {
      toast.error("Failed to delete participant.");
    }
  };

  const handleAddParticipant = (participant) => {
    onAddParticipant(participant);
  };

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
            onAddParticipant={handleAddParticipant}
            eventId={selectedEvent?.$id}
            isEventSelected={!!selectedEvent}
            currentEvent={selectedEvent}
          />
        </div>
        <div className="max-h-[330px] overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Student ID</TableHead>
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
              {filteredParticipants.map((participant) => (
                <TableRow key={participant.$id}>
                  <TableCell>{participant.name}</TableCell>
                  <TableCell>{participant.studentId}</TableCell>
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
                        onUpdateParticipant={(updatedParticipant) =>
                          handleAddParticipant(updatedParticipant)
                        }
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDeleteParticipant(participant.$id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ViewParticipants;
