"use client";

import { memo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TruncatedText } from "../components/TruncatedText";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Edit } from "lucide-react";

const PhysicalTab = memo(({ employees, loading, onView, onEdit }) => {
  if (loading) {
    return (
      <div className="p-4 text-center">Loading physical fitness data...</div>
    );
  }

  if (!employees?.length) {
    return (
      <div className="p-4 text-center">No physical fitness data found.</div>
    );
  }

  return (
    <div className="relative overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Employee ID</TableHead>
            <TableHead>Full Name</TableHead>
            <TableHead>Has Sports Skills</TableHead>
            <TableHead>Sports Skills</TableHead>
            <TableHead>Joined SCUFAR</TableHead>
            <TableHead>SCUFAR No Reason</TableHead>
            <TableHead>Has Fitness Program</TableHead>
            <TableHead>Avails Health Program</TableHead>
            <TableHead>Has Fitness Guidelines</TableHead>
            <TableHead>Program Management</TableHead>
            <TableHead>GAD Improvement Comments</TableHead>
            <TableHead>Year</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {employees.map((employee) => (
            <TableRow key={employee.$id}>
              <TableCell>{employee.employeeId}</TableCell>
              <TableCell>
                <TruncatedText text={employee.fullName} limit={30} />
              </TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className={`${
                    employee.hasSportsSkills
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {employee.hasSportsSkills ? "Yes" : "No"}
                </Badge>
              </TableCell>
              <TableCell>
                <TruncatedText text={employee.sportsSkills} limit={40} />
              </TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className={`${
                    employee.joinedSCUFAR
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {employee.joinedSCUFAR ? "Yes" : "No"}
                </Badge>
              </TableCell>
              <TableCell>
                <TruncatedText text={employee.SCUFARNoReason} limit={40} />
              </TableCell>
              <TableCell>
                <TruncatedText text={employee.hasFitnessProgram} limit={20} />
              </TableCell>
              <TableCell>
                <TruncatedText text={employee.availsHealthProgram} limit={20} />
              </TableCell>
              <TableCell>
                <TruncatedText
                  text={employee.hasFitnessGuidelines}
                  limit={20}
                />
              </TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className={`${
                    employee.fitnessProgramManaged
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {employee.fitnessProgramManaged ? "Yes" : "No"}
                </Badge>
              </TableCell>
              <TableCell>
                <TruncatedText
                  text={employee.GADImprovementComments}
                  limit={40}
                />
              </TableCell>
              <TableCell>{employee.year}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onView(employee)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEdit(employee)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
});

PhysicalTab.displayName = "PhysicalTab";
export default PhysicalTab;
