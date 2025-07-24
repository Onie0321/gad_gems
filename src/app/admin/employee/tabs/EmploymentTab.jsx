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
import { Button } from "@/components/ui/button";
import { Eye, Edit } from "lucide-react";

const EmploymentTab = memo(({ employees, loading, onView, onEdit }) => {
  if (loading) {
    return <div className="p-4 text-center">Loading employment details...</div>;
  }

  if (!employees?.length) {
    return <div className="p-4 text-center">No employment details found.</div>;
  }

  return (
    <div className="relative overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Employee ID</TableHead>
            <TableHead>Full Name</TableHead>
            <TableHead>Employment Status</TableHead>
            <TableHead>Assignment</TableHead>
            <TableHead>Office</TableHead>
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
                <TruncatedText text={employee.employmentStatus} limit={30} />
              </TableCell>
              <TableCell>
                <TruncatedText text={employee.assignment} limit={40} />
              </TableCell>
              <TableCell>
                <TruncatedText text={employee.office} limit={40} />
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

EmploymentTab.displayName = "EmploymentTab";
export default EmploymentTab;
