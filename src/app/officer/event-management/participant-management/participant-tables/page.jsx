import { useState } from 'react';
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
import {
  GraduationCap,
  Users,
  UsersRound,
  Search,
  UserPlus,
  Edit,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const EmptyState = ({ message }) => (
  <div className="flex flex-col items-center justify-center py-12 text-center">
    <Search className="h-12 w-12 text-muted-foreground mb-4" />
    <p className="text-lg font-medium text-muted-foreground mb-2">{message}</p>
    <p className="text-sm text-muted-foreground flex items-center gap-2">
      <UserPlus className="h-4 w-4" />
      Click "Add Participant" above to add new participants
    </p>
  </div>
);

export default function ParticipantTables({
  participants,
  onUpdateParticipant,
  onDeleteParticipant,
  isFinalized,
}) {
  const [activeSection, setActiveSection] = useState("students");
  const [editingParticipant, setEditingParticipant] = useState(null);

  const studentParticipants = participants.filter((p) => p.studentId);
  const staffParticipants = participants.filter((p) => p.staffFacultyId);
  const communityParticipants = participants.filter(
    (p) => !p.studentId && !p.staffFacultyId
  );

  const studentCounts = {
    male: studentParticipants.filter(p => p.sex === "Male").length,
    female: studentParticipants.filter(p => p.sex === "Female").length,
    total: studentParticipants.length
  };

  const staffCounts = {
    male: staffParticipants.filter(p => p.sex === "Male").length,
    female: staffParticipants.filter(p => p.sex === "Female").length,
    total: staffParticipants.length
  };

  const communityCounts = {
    male: communityParticipants.filter(p => p.sex === "Male").length,
    female: communityParticipants.filter(p => p.sex === "Female").length,
    total: communityParticipants.length
  };

  return (
    <div id="participant-tables" className="space-y-6">

      <Tabs 
        defaultValue="students" 
        value={activeSection}
        onValueChange={setActiveSection}
      >
        <TabsList className="grid w-full grid-cols-3 gap-4 rounded-lg p-2 bg-muted">
          <TabsTrigger 
            value="students"
            className={cn(
              "flex flex-col items-center gap-1 rounded-md transition-all",
              "data-[state=active]:bg-background data-[state=active]:shadow-sm"
            )}
          >
            <div className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4" />
              <span>Students ({studentCounts.total})</span>
            </div>
           
          </TabsTrigger>

          <TabsTrigger 
            value="staff"
            className={cn(
              "flex flex-col items-center gap-1 rounded-md transition-all",
              "data-[state=active]:bg-background data-[state=active]:shadow-sm"
            )}
          >
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span>Staff/Faculty ({staffCounts.total})</span>
            </div>
           
          </TabsTrigger>

          <TabsTrigger 
            value="community"
            className={cn(
              "flex flex-col items-center gap-1 rounded-md transition-all",
              "data-[state=active]:bg-background data-[state=active]:shadow-sm"
            )}
          >
            <div className="flex items-center gap-2">
              <UsersRound className="h-4 w-4" />
              <span>Community ({communityCounts.total})</span>
            </div>
           
          </TabsTrigger>
        </TabsList>
        <TabsContent value="students">
          <div className="max-h-[330px] overflow-y-auto">
            {studentParticipants.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>Student ID</TooltipTrigger>
                          <TooltipContent>
                            <p>Unique identifier for student</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableHead>
                    <TableHead>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>Name</TooltipTrigger>
                          <TooltipContent>
                            <p>Full name of the participant</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableHead>
                    <TableHead>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>Sex</TooltipTrigger>
                          <TooltipContent>
                            <p>Biological sex of the participant</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableHead>
                    <TableHead>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>Age</TooltipTrigger>
                          <TooltipContent>
                            <p>Current age of the participant</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableHead>
                    <TableHead>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>Address</TooltipTrigger>
                          <TooltipContent>
                            <p>Current residential address</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableHead>
                    <TableHead>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>School</TooltipTrigger>
                          <TooltipContent>
                            <p>Academic school or department</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableHead>
                    <TableHead>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>Year</TooltipTrigger>
                          <TooltipContent>
                            <p>Current year level</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableHead>
                    <TableHead>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>Section</TooltipTrigger>
                          <TooltipContent>
                            <p>Current class section</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableHead>
                    <TableHead>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>Ethnic Group</TooltipTrigger>
                          <TooltipContent>
                            <p>Participant's ethnic or cultural group</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableHead>
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
                      <TableCell>{participant.address}</TableCell>
                      <TableCell>{participant.school}</TableCell>
                      <TableCell>{participant.year}</TableCell>
                      <TableCell>{participant.section}</TableCell>
                      <TableCell>{participant.ethnicGroup}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingParticipant(participant);
                            }}
                            className="flex flex-col items-center gap-1 text-black hover:text-black/80"
                          >
                            <Edit className="h-4 w-4" />
                            <span className="text-xs">Edit</span>
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
                    <TableHead>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>Staff/Faculty ID</TooltipTrigger>
                          <TooltipContent>
                            <p>Unique identifier for staff/faculty member</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableHead>
                    <TableHead>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>Name</TooltipTrigger>
                          <TooltipContent>
                            <p>Full name of the participant</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableHead>
                    <TableHead>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>Sex</TooltipTrigger>
                          <TooltipContent>
                            <p>Biological sex of the participant</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableHead>
                    <TableHead>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>Age</TooltipTrigger>
                          <TooltipContent>
                            <p>Current age of the participant</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableHead>
                    <TableHead>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>Address</TooltipTrigger>
                          <TooltipContent>
                            <p>Current residential address</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableHead>
                    <TableHead>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>Ethnic Group</TooltipTrigger>
                          <TooltipContent>
                            <p>Participant's ethnic or cultural group</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableHead>
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
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditingParticipant(participant);
                              }}
                              className="flex flex-col items-center gap-1 text-black hover:text-black/80"
                            >
                              <Edit className="h-4 w-4" />
                              <span className="text-xs">Edit</span>
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
                    <TableHead>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>Name</TooltipTrigger>
                          <TooltipContent>
                            <p>Full name of the participant</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableHead>
                    <TableHead>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>Sex</TooltipTrigger>
                          <TooltipContent>
                            <p>Biological sex of the participant</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableHead>
                    <TableHead>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>Age</TooltipTrigger>
                          <TooltipContent>
                            <p>Current age of the participant</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableHead>
                    <TableHead>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>Address</TooltipTrigger>
                          <TooltipContent>
                            <p>Current residential address</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableHead>
                    <TableHead>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>Ethnic Group</TooltipTrigger>
                          <TooltipContent>
                            <p>Participant's ethnic or cultural group</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableHead>
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
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditingParticipant(participant);
                              }}
                              className="flex flex-col items-center gap-1 text-black hover:text-black/80"
                            >
                              <Edit className="h-4 w-4" />
                              <span className="text-xs">Edit</span>
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

      {/* Edit Dialog - shown only when editingParticipant is set */}
      {editingParticipant && (
        <EditParticipantDialog
          participant={editingParticipant}
          onUpdateParticipant={(updatedParticipant) => {
            onUpdateParticipant(updatedParticipant);
            setEditingParticipant(null); // Close dialog after update
          }}
          participantType={
            editingParticipant.studentId 
              ? 'student' 
              : editingParticipant.staffFacultyId 
                ? 'staff' 
                : 'community'
          }
          isOpen={!!editingParticipant}
          onClose={() => setEditingParticipant(null)}
        />
      )}
    </div>
  );
}
