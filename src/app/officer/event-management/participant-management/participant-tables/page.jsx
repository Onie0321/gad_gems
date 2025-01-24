import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import EditParticipantDialog from "../edit-participant-dialog/page";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const EmptyState = ({ message }) => (
  <div className="flex flex-col items-center justify-center py-8 text-center">
    <p className="text-gray-500 mb-2">{message}</p>
    <p className="text-sm text-gray-400">
      Click the "Add Participant" button above to add new participants
    </p>
  </div>
);

export default function ParticipantTables({
  participants,
  onUpdateParticipant,
  onDeleteParticipant,
  isFinalized
}) {
  const studentParticipants = participants.filter((p) => p.studentId);
  const staffParticipants = participants.filter((p) => p.staffFacultyId);
  const communityParticipants = participants.filter(
    (p) => !p.studentId && !p.staffFacultyId
  );

  return (
    <div className="mt-8">
      <Tabs defaultValue="students">
        <TabsList>
          <TabsTrigger value="students">Students</TabsTrigger>
          <TabsTrigger value="staff">Staff/Faculty</TabsTrigger>
          <TabsTrigger value="community">Community</TabsTrigger>
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
                    <TableHead>Address</TableHead>
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
                      <TableCell>{participant.homeAddress}</TableCell>
                      <TableCell>{participant.school}</TableCell>
                      <TableCell>{participant.year}</TableCell>
                      <TableCell>{participant.section}</TableCell>
                      <TableCell>{participant.ethnicGroup}</TableCell>
                      {!isFinalized && (
                        <TableCell>
                          <div className="flex space-x-2">
                            <EditParticipantDialog
                              participant={participant}
                              onUpdateParticipant={onUpdateParticipant}
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
                      )}
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
                      {!isFinalized && (
                        <TableCell>
                          <div className="flex space-x-2">
                            <EditParticipantDialog
                              participant={participant}
                              onUpdateParticipant={onUpdateParticipant}
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
                      )}
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
                      {!isFinalized && (
                        <TableCell>
                          <div className="flex space-x-2">
                            <EditParticipantDialog
                              participant={participant}
                              onUpdateParticipant={onUpdateParticipant}
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
                      )}
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
    </div>
  );
}
