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

const GenderAwarenessTab = memo(({ employees, loading, onView, onEdit }) => {
  if (loading) {
    return (
      <div className="p-4 text-center">Loading gender awareness data...</div>
    );
  }

  if (!employees?.length) {
    return (
      <div className="p-4 text-center">No gender awareness data found.</div>
    );
  }

  return (
    <div className="relative overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Employee ID</TableHead>
            <TableHead>Full Name</TableHead>
            <TableHead>Aware of GAD Activities</TableHead>
            <TableHead>GAD Examples</TableHead>
            <TableHead>Participates in GAD</TableHead>
            <TableHead>Aware of FB Page</TableHead>
            <TableHead>Visited FB Page</TableHead>
            <TableHead>Aware of Laws</TableHead>
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
                    employee.awareGadAct
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {employee.awareGadAct ? "Yes" : "No"}
                </Badge>
              </TableCell>
              <TableCell>
                <TruncatedText text={employee.awareGadSpecify} limit={40} />
              </TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className={`${
                    employee.participateGadAct
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {employee.participateGadAct ? "Yes" : "No"}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className={`${
                    employee.awareGadFbPage
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {employee.awareGadFbPage ? "Yes" : "No"}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className={`${
                    employee.visitedGadFbPage
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {employee.visitedGadFbPage ? "Yes" : "No"}
                </Badge>
              </TableCell>
              <TableCell>
                <TruncatedText text={employee.awareLaws} limit={40} />
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

GenderAwarenessTab.displayName = "GenderAwarenessTab";
export default GenderAwarenessTab;
